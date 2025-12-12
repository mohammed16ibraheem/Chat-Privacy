use crate::models::{AppState, PendingSignalingMessage};
use axum::{extract::State, http::StatusCode, Json};
use std::time::Instant;
use tracing::info;
use uuid::Uuid;

use crate::models::{
    AnswerRequest, CheckUsernameRequest, CheckUsernameResponse, IceCandidateRequest,
    OfferRequest, OnlineUsersResponse, RegisterRequest, RegisterResponse, SignalingResponse,
};

/// Register a new user for WebRTC signaling
pub async fn register_user(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> Result<Json<RegisterResponse>, (StatusCode, Json<SignalingResponse>)> {
    let mut users = state.users.write().await;
    let mut signaling = state.signaling.write().await;

    // Check if username already exists
    if users.contains_key(&request.username) {
        return Err((
            StatusCode::CONFLICT,
            Json(SignalingResponse {
                success: false,
                message: "Username already exists".to_string(),
            }),
        ));
    }

    let user_id = Uuid::new_v4().to_string();

    // Store user data
    users.insert(
        request.username.clone(),
        crate::models::UserData {
            user_id: user_id.clone(),
            username: request.username.clone(),
            public_key: request.public_key.clone(),
            last_seen: Instant::now(),
        },
    );

    // Store signaling data
    signaling.insert(
        request.username.clone(),
        crate::models::SignalingData {
            username: request.username.clone(),
            public_key: request.public_key.clone(),
            last_seen: Instant::now(),
        },
    );

    info!("User registered: {}", request.username);

    Ok(Json(RegisterResponse {
        user_id,
        username: request.username,
    }))
}

/// Check if username is available
pub async fn check_username(
    State(state): State<AppState>,
    Json(request): Json<CheckUsernameRequest>,
) -> Json<CheckUsernameResponse> {
    let users = state.users.read().await;
    let is_available = !users.contains_key(&request.username);

    Json(CheckUsernameResponse {
        available: is_available,
        message: if is_available {
            "Username is available".to_string()
        } else {
            "Username already exists".to_string()
        },
    })
}

/// Get list of online users
pub async fn get_online_users(
    State(state): State<AppState>,
) -> Json<OnlineUsersResponse> {
    let users = state.users.read().await;
    let usernames: Vec<String> = users.keys().cloned().collect();
    Json(OnlineUsersResponse { users: usernames })
}

/// Handle WebRTC offer (initiate connection)
pub async fn handle_offer(
    State(state): State<AppState>,
    Json(request): Json<OfferRequest>,
) -> Result<Json<SignalingResponse>, (StatusCode, Json<SignalingResponse>)> {
    // Verify both users are online
    let users = state.users.read().await;
    
    if !users.contains_key(&request.from) {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(SignalingResponse {
                success: false,
                message: "Sender not registered".to_string(),
            }),
        ));
    }

    if !users.contains_key(&request.to) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(SignalingResponse {
                success: false,
                message: "Recipient not found or offline".to_string(),
            }),
        ));
    }
    drop(users);

    // Store offer for recipient to poll
    let mut pending = state.pending_messages.write().await;
    let recipient_messages = pending.entry(request.to.clone()).or_insert_with(Vec::new);
    recipient_messages.push(PendingSignalingMessage {
        from: request.from.clone(),
        to: request.to.clone(),
        message_type: "offer".to_string(),
        data: request.offer,
    });
    
    Ok(Json(SignalingResponse {
        success: true,
        message: "Offer received".to_string(),
    }))
}

/// Handle WebRTC answer
pub async fn handle_answer(
    State(state): State<AppState>,
    Json(request): Json<AnswerRequest>,
) -> Result<Json<SignalingResponse>, (StatusCode, Json<SignalingResponse>)> {
    let users = state.users.read().await;
    
    if !users.contains_key(&request.from) || !users.contains_key(&request.to) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(SignalingResponse {
                success: false,
                message: "User not found".to_string(),
            }),
        ));
    }
    drop(users);

    // Store answer for recipient to poll
    let mut pending = state.pending_messages.write().await;
    let recipient_messages = pending.entry(request.to.clone()).or_insert_with(Vec::new);
    recipient_messages.push(PendingSignalingMessage {
        from: request.from.clone(),
        to: request.to.clone(),
        message_type: "answer".to_string(),
        data: request.answer,
    });

    Ok(Json(SignalingResponse {
        success: true,
        message: "Answer received".to_string(),
    }))
}

/// Handle ICE candidate exchange
pub async fn handle_ice_candidate(
    State(state): State<AppState>,
    Json(request): Json<IceCandidateRequest>,
) -> Result<Json<SignalingResponse>, (StatusCode, Json<SignalingResponse>)> {
    let users = state.users.read().await;
    
    if !users.contains_key(&request.from) || !users.contains_key(&request.to) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(SignalingResponse {
                success: false,
                message: "User not found".to_string(),
            }),
        ));
    }
    drop(users);

    // Store ICE candidate for recipient to poll
    let mut pending = state.pending_messages.write().await;
    let recipient_messages = pending.entry(request.to.clone()).or_insert_with(Vec::new);
    recipient_messages.push(PendingSignalingMessage {
        from: request.from.clone(),
        to: request.to.clone(),
        message_type: "ice-candidate".to_string(),
        data: request.candidate,
    });

    Ok(Json(SignalingResponse {
        success: true,
        message: "ICE candidate received".to_string(),
    }))
}

/// Get pending signaling messages for a user
pub async fn get_pending_messages(
    State(state): State<AppState>,
    username: String,
) -> Json<Vec<PendingSignalingMessage>> {
    let mut pending = state.pending_messages.write().await;
    let messages = pending.remove(&username).unwrap_or_default();
    Json(messages)
}

/// Remove user on disconnect (for future use)
#[allow(dead_code)]
pub async fn disconnect_user(
    State(state): State<AppState>,
    username: String,
) {
    let mut users = state.users.write().await;
    let mut signaling = state.signaling.write().await;
    
    users.remove(&username);
    signaling.remove(&username);
    
    info!("User disconnected: {}", username);
}

