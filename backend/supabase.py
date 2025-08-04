from jose import jwt
from jose.exceptions import JWTError
from typing import Optional

async def validate_supabase_token(token: str) -> Optional[dict]:
    try:
        # Just decode without verifying signature
        payload = jwt.get_unverified_claims(token)
        return payload
    except JWTError as e:
        print("Token decoding failed:", str(e))
        return None
