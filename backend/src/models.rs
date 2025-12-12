use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::Arc,
    time::Instant,
};
use tokio::sync::RwLock;

/// User data stored in memory (ephemeral)
/// Note: Not serializable because Instant cannot be serialized
/// This is fine since UserData is only used server-side
#[derive(Debug, Clone)]
pub struct UserData {
    #[allow(dead_code)] // Used for future features and ensuring uniqueness
    pub user_id: String,      // UUID for unique identification
    #[allow(dead_code)] // Stored for routing and future features
    pub username: String,     // Username (must be unique)
    pub public_key: String,   // Base64 encoded public key
    #[allow(dead_code)] // Kept for future features (connection time tracking, etc.)
    pub last_seen: Instant,
}

/// Pending signaling message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingSignalingMessage {
    pub from: String,
    pub to: String,
    pub message_type: String, // "offer", "answer", "ice-candidate"
    pub data: String, // SDP or ICE candidate JSON
}

/// Application state - all data stored in memory (ephemeral)
#[derive(Clone)]
pub struct AppState {
    /// Online users: username -> UserData
    pub users: Arc<RwLock<HashMap<String, UserData>>>,
    /// WebRTC signaling: username -> pending offer/answer/ICE candidates
    pub signaling: Arc<RwLock<HashMap<String, SignalingData>>>,
    /// Pending signaling messages: username -> Vec<PendingSignalingMessage>
    pub pending_messages: Arc<RwLock<HashMap<String, Vec<PendingSignalingMessage>>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(HashMap::new())),
            signaling: Arc::new(RwLock::new(HashMap::new())),
            pending_messages: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

/// WebRTC signaling data for a user
#[derive(Debug, Clone)]
pub struct SignalingData {
    #[allow(dead_code)] // Stored for routing and future features
    pub username: String,
    #[allow(dead_code)] // Stored for future features
    pub public_key: String,
    #[allow(dead_code)] // Kept for future features (connection time tracking, etc.)
    pub last_seen: Instant,
}

/// Request to get a user's public key
#[derive(Debug, Deserialize)]
pub struct GetPublicKeyRequest {
    pub username: String,
}

/// Response with user's public key
#[derive(Debug, Serialize)]
pub struct PublicKeyResponse {
    pub public_key: String,
}

/// Error response
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// WebRTC signaling request/response types
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub public_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterResponse {
    pub user_id: String,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckUsernameRequest {
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CheckUsernameResponse {
    pub available: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OfferRequest {
    pub from: String,
    pub to: String,
    pub offer: String, // SDP offer
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnswerRequest {
    pub from: String,
    pub to: String,
    pub answer: String, // SDP answer
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IceCandidateRequest {
    pub from: String,
    pub to: String,
    pub candidate: String, // ICE candidate
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignalingResponse {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OnlineUsersResponse {
    pub users: Vec<String>,
}

/// Encrypted message payload (server never decrypts this)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedMessage {
    pub ciphertext: String,  // Base64 encoded
    pub nonce: String,       // Base64 encoded
    pub public_key: String,  // Sender's public key (Base64 encoded)
}

