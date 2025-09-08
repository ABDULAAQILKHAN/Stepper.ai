import asyncio
import google.generativeai as genai
from typing import Dict, Any, Callable, List
from .base import AIProvider, ProviderRegistry


@ProviderRegistry.register("gemini")
class GeminiProvider(AIProvider):
    """Google Gemini AI Provider"""
    
    def __init__(self, api_key: str, model: str):
        super().__init__(api_key, model)
        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel(model)
    
    def _convert_messages_to_gemini_format(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Convert standard chat format to Gemini format"""
        gemini_messages = []
        
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            
            # Gemini uses "user" and "model" roles
            if role == "assistant":
                role = "model"
            elif role == "system":
                # Convert system messages to user messages with instruction prefix
                role = "user"
                content = f"System instruction: {content}"
            
            gemini_messages.append({
                "role": role,
                "parts": [{"text": content}]
            })
        
        return gemini_messages
    
    async def stream_chat(
        self, 
        messages: List[Dict[str, str]], 
        on_chunk: Callable[[Dict[str, Any]], None]
    ) -> None:
        """Stream chat responses from Gemini"""
        try:
            # Convert messages to Gemini format
            gemini_messages = self._convert_messages_to_gemini_format(messages)
            
            # Create chat session
            chat = self.client.start_chat(history=gemini_messages[:-1])
            
            # Get the last message (current user input)
            last_message = gemini_messages[-1]["parts"][0]["text"]
            
            # Generate streaming response
            response = await chat.send_message_async(
                last_message,
                stream=True
            )
            
            async for chunk in response:
                if chunk.text:
                    on_chunk({
                        "content": chunk.text,
                        "isComplete": False,
                        "error": None
                    })
            
            # Signal completion
            on_chunk({
                "content": "",
                "isComplete": True,
                "error": None
            })
            
        except Exception as e:
            on_chunk({
                "content": "",
                "isComplete": True,
                "error": str(e)
            })
    
    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        """Generate a complete response from Gemini"""
        try:
            # Convert messages to Gemini format
            gemini_messages = self._convert_messages_to_gemini_format(messages)
            
            # Create chat session
            chat = self.client.start_chat(history=gemini_messages[:-1])
            
            # Get the last message (current user input)
            last_message = gemini_messages[-1]["parts"][0]["text"]
            
            # Generate response
            response = await chat.send_message_async(last_message)
            
            return response.text
            
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
