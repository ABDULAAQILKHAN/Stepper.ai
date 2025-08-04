from fastapi import Request, HTTPException
import os
import jwt  # pyjwt

async def verify_token(request: Request):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        jwt_token = token.split("Bearer ")[1]
        payload = jwt.decode(jwt_token, options={"verify_signature": False})
        request.state.user = payload["sub"]
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
