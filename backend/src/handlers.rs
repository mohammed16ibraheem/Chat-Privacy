use axum::{extract::State, http::StatusCode, Json};

use crate::models::{AppState, ErrorResponse, GetPublicKeyRequest, PublicKeyResponse};

/// Get a user's public key by username
pub async fn get_public_key(
    State(state): State<AppState>,
    Json(request): Json<GetPublicKeyRequest>,
) -> Result<Json<PublicKeyResponse>, (StatusCode, Json<ErrorResponse>)> {
    let users = state.users.read().await;
    
    // Find user by username
    let user_data = users.get(&request.username);
    
    match user_data {
        Some(user) => Ok(Json(PublicKeyResponse {
            public_key: user.public_key.clone(),
        })),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ErrorResponse {
                error: "User not found or offline".to_string(),
            }),
        )),
    }
}

