use axum::{
    extract::State,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

mod handlers;
mod models;
mod signaling;

use handlers::*;
use models::*;
use signaling::{get_pending_messages, *};

#[tokio::main]
async fn main() {
    // Initialize tracing (minimal logging - zero metadata)
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(false)
        .init();

    // Initialize libsodium (for future encryption features)
    sodiumoxide::init().expect("Failed to initialize libsodium");

    let state = AppState::new();

    // Build router - WebRTC signaling server
    let app = Router::new()
        .route("/", get(health_check))
        .route("/api/user/public-key", post(get_public_key))
        .route("/api/register", post(register_user))
        .route("/api/check-username", post(check_username))
        .route("/api/online-users", get(get_online_users))
        .route("/api/webrtc/offer", post(handle_offer))
        .route("/api/webrtc/answer", post(handle_answer))
        .route("/api/webrtc/ice-candidate", post(handle_ice_candidate))
        .route("/api/webrtc/pending-messages/:username", get(|State(state): State<AppState>, axum::extract::Path(username): axum::extract::Path<String>| async move {
            get_pending_messages(State(state), username).await
        }))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    info!("🚀 Chat Privacy Backend (WebRTC Signaling) starting on {}", addr);
    info!("🔒 Zero metadata logging enabled");
    info!("⚡ Built with Rust for maximum security and performance");
    info!("🌐 WebRTC peer-to-peer messaging enabled");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind address");

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "chat-privacy-backend",
        "version": "0.1.0",
        "protocol": "WebRTC"
    }))
}

