import os
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

# This will be used as a security dependency
token_auth_scheme = HTTPBearer()

# Initialize Firebase Admin SDK
try:
    # Set this environment variable to the path of your Firebase service account JSON file
    cred_path = os.environ.get("FIREBASE_ADMIN_SDK_PATH")
    if not cred_path:
        raise ValueError("FIREBASE_ADMIN_SDK_PATH environment variable not set.")
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    
    # Initialize Firestore
    db = firestore.client()
except Exception as e:
    print(f"FATAL: Could not initialize Firebase Admin SDK: {e}")
    
async def get_current_user(token: str = Depends(token_auth_scheme)) -> dict:
    """Dependency to verify Firebase ID token and return user data."""
    try:
        # token.credentials contains the actual Bearer token string
        decoded_token = auth.verify_id_token(token.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )