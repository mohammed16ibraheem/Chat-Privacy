use axum::{
    extract::{State, ws::WebSocketUpgrade},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

mod handlers;
mod models;
mod websocket;
mod connection_manager;

use handlers::*;
use models::*;
use websocket::*;

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

    // Note: No cleanup task needed
    // Users are automatically removed when they disconnect (handled in websocket.rs)
    // We don't auto-delete based on time - users stay connected as long as they're online

    // Build router
    let app = Router::new()
        .route("/", get(health_check))
        .route("/api/user/public-key", post(get_public_key))
        .route("/api/ws", get(websocket_handler))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    info!("🚀 Chat Privacy Backend starting on {}", addr);
    info!("🔒 Zero metadata logging enabled");
    info!("⚡ Built with Rust for maximum security and performance");

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
        "version": "0.1.0"
    }))
}

/// WebSocket handler
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

