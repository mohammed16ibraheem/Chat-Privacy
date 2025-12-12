use axum::extract::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt};
use serde_json;
use std::time::Instant;
use tokio::sync::mpsc;
use tracing::{error, info, warn};

use crate::models::{AppState, ConnectionInfo, UserData, WebSocketMessage};

/// Handle WebSocket connection
pub async fn handle_websocket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    
    // Create channel for sending messages to this connection
    let (tx, mut rx) = mpsc::unbounded_channel();
    
    // Clone tx for the connection manager (we'll register it after user registers)
    let tx_for_manager = tx.clone();
    
    // Spawn task to forward messages from channel to WebSocket
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });
    
    let mut username: Option<String> = None;

    // Handle incoming messages
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                match serde_json::from_str::<WebSocketMessage>(&text) {
                    Ok(ws_msg) => {
                        match ws_msg {
                            WebSocketMessage::CheckUsername { username: user } => {
                                // Check if username is already taken
                                let users = state.users.read().await;
                                let is_available = !users.values().any(|u| u.username == user);
                                drop(users);
                                
                                let response = WebSocketMessage::UsernameAvailable {
                                    available: is_available,
                                    message: if is_available {
                                        "Username is available".to_string()
                                    } else {
                                        "Username already exists".to_string()
                                    },
                                };
                                
                                if tx.send(Message::Text(serde_json::to_string(&response).unwrap())).is_err() {
                                    error!("Failed to send username check response");
                                    break;
                                }
                            }
                            WebSocketMessage::Register { username: user, public_key } => {
                                // Check if username already exists
                                let mut users = state.users.write().await;
                                
                                // Check if username is already taken
                                let username_taken = users.values().any(|u| u.username == user);
                                
                                if username_taken {
                                    let error_msg = WebSocketMessage::Error {
                                        message: "Username already exists. Please choose a different username.".to_string(),
                                    };
                                    drop(users);
                                    if tx.send(Message::Text(serde_json::to_string(&error_msg).unwrap())).is_err() {
                                        error!("Failed to send error");
                                    }
                                    continue;
                                }
                                
                                // Generate unique user ID
                                let user_id = uuid::Uuid::new_v4().to_string();
                                
                                // Register user
                                username = Some(user.clone());
                                
                                // Store user data keyed by username (for routing)
                                users.insert(
                                    user.clone(),  // Use username as key for routing
                                    UserData {
                                        user_id: user_id.clone(),
                                        username: user.clone(),
                                        public_key: public_key.clone(),
                                        last_seen: Instant::now(),
                                    },
                                );
                                drop(users);
                                
                                // Send registration success
                                let registered_msg = WebSocketMessage::Registered {
                                    user_id: user_id.clone(),
                                    username: user.clone(),
                                };
                                
                                if tx.send(Message::Text(serde_json::to_string(&registered_msg).unwrap())).is_err() {
                                    error!("Failed to send registration confirmation");
                                    break;
                                }

                                // Store connection info (use username as key for routing)
                                {
                                    let mut connections = state.connections.write().await;
                                    connections.insert(
                                        user.clone(),
                                        ConnectionInfo {
                                            username: user.clone(),
                                            connected_at: Instant::now(),
                                        },
                                    );
                                }

                                // Register connection in connection manager (use username for routing)
                                // Clone tx for the manager (we need to keep tx for sending messages)
                                state.connection_manager.register(user.clone(), tx_for_manager.clone()).await;

                                // Send online users list
                                let online_users = get_online_users(&state).await;
                                let response = WebSocketMessage::OnlineUsers {
                                    users: online_users.clone(),
                                };
                                
                                // Use tx to send message (tx is still available here)
                                if tx.send(Message::Text(serde_json::to_string(&response).unwrap())).is_err() {
                                    error!("Failed to send online users");
                                    break;
                                }

                                // Broadcast to all users that a new user came online
                                broadcast_user_list(&state).await;

                                info!("User registered: {}", user);
                            }
                            WebSocketMessage::SendMessage { to, encrypted } => {
                                if let Some(ref from_user) = username {
                                    // Forward encrypted message to recipient
                                    if let Err(e) = forward_message(
                                        &state,
                                        from_user.clone(),
                                        to.clone(),
                                        encrypted,
                                    )
                                    .await
                                    {
                                        let error_msg = WebSocketMessage::Error {
                                            message: e,
                                        };
                                        let _ = tx.send(Message::Text(
                                            serde_json::to_string(&error_msg).unwrap(),
                                        ));
                                    }
                                } else {
                                    // User not registered
                                    let error_msg = WebSocketMessage::Error {
                                        message: "Not authenticated. Please register first.".to_string(),
                                    };
                                    let _ = tx.send(Message::Text(
                                        serde_json::to_string(&error_msg).unwrap(),
                                    ));
                                }
                            }
                            _ => {
                                warn!("Unexpected message type received");
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to parse WebSocket message: {}", e);
                    }
                }
            }
            Ok(Message::Close(_)) => {
                break;
            }
            Err(e) => {
                error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    // Cleanup on disconnect
    send_task.abort();
    
    if let Some(ref user) = username {
        {
            let mut users = state.users.write().await;
            users.remove(user);
        }
        {
            let mut connections = state.connections.write().await;
            connections.remove(user);
        }
        
        // Remove from connection manager
        state.connection_manager.remove(user).await;
        
        // Notify all users that this user went offline
        broadcast_user_list(&state).await;
        
        info!("User disconnected: {}", user);
    }
}

/// Get list of online usernames
async fn get_online_users(state: &AppState) -> Vec<String> {
    let users = state.users.read().await;
    users.values().map(|u| u.username.clone()).collect()
}

/// Broadcast updated user list to all connected clients
async fn broadcast_user_list(state: &AppState) {
    let online_users = get_online_users(state).await;
    let message = WebSocketMessage::OnlineUsers {
        users: online_users,
    };
    
    if let Ok(message_json) = serde_json::to_string(&message) {
        state.connection_manager.broadcast(Message::Text(message_json)).await;
    }
}

/// Forward encrypted message to recipient
async fn forward_message(
    state: &AppState,
    from: String,
    to: String,
    encrypted: crate::models::EncryptedMessage,
) -> Result<(), String> {
    // Check if recipient is online (users are stored by username)
    let users = state.users.read().await;
    if !users.contains_key(&to) {
        drop(users);
        return Err("Recipient not found or offline".to_string());
    }
    drop(users);

    // Create message
    let message = WebSocketMessage::Message {
        id: uuid::Uuid::new_v4().to_string(),
        from,
        to: to.clone(),
        encrypted,
        timestamp: chrono::Utc::now().timestamp_millis() as u64,
    };

    // Send via connection manager
    let message_text = serde_json::to_string(&message)
        .map_err(|e| format!("Failed to serialize message: {}", e))?;
    
    state
        .connection_manager
        .send_to_user(&to, Message::Text(message_text))
        .await
        .map_err(|e| format!("Failed to send message: {}", e))?;
    
    Ok(())
}

