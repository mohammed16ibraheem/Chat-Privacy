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
    pub username: String,     // Username (must be unique)
    pub public_key: String,   // Base64 encoded public key
    #[allow(dead_code)] // Kept for future features (connection time tracking, etc.)
    pub last_seen: Instant,
}

/// WebSocket connection information
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields may be used for future features or debugging
pub struct ConnectionInfo {
    pub username: String,
    pub connected_at: Instant,
}

/// Application state - all data stored in memory (ephemeral)
#[derive(Clone)]
pub struct AppState {
    /// Online users: username -> UserData
    pub users: Arc<RwLock<HashMap<String, UserData>>>,
    /// Active WebSocket connections: username -> ConnectionInfo
    pub connections: Arc<RwLock<HashMap<String, ConnectionInfo>>>,
    /// Connection manager for WebSocket message delivery
    pub connection_manager: Arc<crate::connection_manager::ConnectionManager>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(HashMap::new())),
            connections: Arc::new(RwLock::new(HashMap::new())),
            connection_manager: Arc::new(crate::connection_manager::ConnectionManager::new()),
        }
    }
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

/// WebSocket message types
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketMessage {
    /// Client sends this to check if username is available
    #[serde(rename = "check_username")]
    CheckUsername {
        username: String,
    },
    /// Server responds to username check
    #[serde(rename = "username_available")]
    UsernameAvailable {
        available: bool,
        message: String,
    },
    /// Client sends this to register/login
    #[serde(rename = "register")]
    Register {
        username: String,
        public_key: String,
    },
    /// Server responds to registration
    #[serde(rename = "registered")]
    Registered {
        user_id: String,
        username: String,
    },
    /// Send encrypted message to another user
    #[serde(rename = "send_message")]
    SendMessage {
        to: String,
        encrypted: EncryptedMessage,
    },
    /// Server sends this when a message is received
    #[serde(rename = "message")]
    Message {
        id: String,
        from: String,
        to: String,
        encrypted: EncryptedMessage,
        timestamp: u64,
    },
    /// Server sends list of online users
    #[serde(rename = "online_users")]
    OnlineUsers {
        users: Vec<String>,
    },
    /// Error message
    #[serde(rename = "error")]
    Error {
        message: String,
    },
}

/// Encrypted message payload (server never decrypts this)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedMessage {
    pub ciphertext: String,  // Base64 encoded
    pub nonce: String,       // Base64 encoded
    pub public_key: String,  // Sender's public key (Base64 encoded)
}

