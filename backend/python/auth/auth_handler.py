import os
import time
import jwt
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

def token_response(token: str):
    return {
        "access_token": token,
        "token_type": "bearer"
    }

def sign_jwt(user_id: str) -> Dict[str, str]:
    """
    Create a JWT token for a user
    """
    payload = {
        "user_id": user_id,
        "expires": time.time() + 24 * 60 * 60  # 24 hours expiry
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token_response(token)

def decode_jwt(token: str) -> Optional[Dict]:
    """
    Decode a JWT token
    """
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else None
    except:
        return None

def verify_token(token: str) -> Optional[str]:
    """
    Verify a JWT token and return the user_id if valid
    """
    decoded_token = decode_jwt(token)
    if decoded_token:
        return decoded_token["user_id"]
    return None 