use axum::extract::ws::Message;
use std::{
    collections::HashMap,
    sync::Arc,
};
use tokio::sync::RwLock;
use tracing::error;

/// Manages active WebSocket connections
#[derive(Clone)]
pub struct ConnectionManager {
    /// Map username to their WebSocket sender
    connections: Arc<RwLock<HashMap<String, tokio::sync::mpsc::UnboundedSender<Message>>>>,
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a new connection
    pub async fn register(&self, username: String, sender: tokio::sync::mpsc::UnboundedSender<Message>) {
        let mut connections = self.connections.write().await;
        connections.insert(username, sender);
    }

    /// Remove a connection
    pub async fn remove(&self, username: &str) {
        let mut connections = self.connections.write().await;
        connections.remove(username);
    }

    /// Send message to a specific user
    pub async fn send_to_user(&self, username: &str, message: Message) -> Result<(), String> {
        let connections = self.connections.read().await;
        if let Some(sender) = connections.get(username) {
            sender.send(message).map_err(|_| "Failed to send message".to_string())
        } else {
            Err("User not connected".to_string())
        }
    }

    /// Broadcast message to all connected users
    /// Note: Currently only supports Text messages (which is what we use)
    pub async fn broadcast(&self, message: Message) {
        // Extract text content if it's a Text message
        let text_content = match &message {
            Message::Text(text) => text.clone(),
            _ => {
                // For non-text messages, we don't broadcast
                // (we only use Text messages in our protocol)
                return;
            }
        };
        
        let connections = self.connections.read().await;
        
        // Send cloned text message to each connected user
        for (username, sender) in connections.iter() {
            if let Err(e) = sender.send(Message::Text(text_content.clone())) {
                error!("Failed to send to {}: {:?}", username, e);
            }
        }
    }

    /// Get list of connected usernames
    #[allow(dead_code)] // May be used for future features or debugging
    pub async fn get_connected_users(&self) -> Vec<String> {
        let connections = self.connections.read().await;
        connections.keys().cloned().collect()
    }
}

