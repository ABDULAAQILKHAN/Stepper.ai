import asyncio
from typing import Dict, Any, Callable, List
from .providers import ProviderRegistry


class AIService:
    """Service layer for managing AI interactions"""
    
    def __init__(self):
        self.registry = ProviderRegistry
    
    def _map_model_id_to_provider_id(self, model_id: str) -> str:
        """
        Map database model_id (provider name) to actual provider_id
        
        Args:
            model_id: Provider name from database (e.g., "google", "openai")
            
        Returns:
            Provider ID for the registry (e.g., "gemini", "openai")
        """
        mapping = {
            "google": "gemini",
            "openai": "openai", 
            "anthropic": "claude",
            # Add more mappings as needed
        }
        return mapping.get(model_id.lower(), model_id.lower())
    
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        provider_id: str,
        api_key: str,
        model: str,
        on_chunk: Callable[[Dict[str, Any]], None]
    ) -> None:
        """
        Stream chat responses using the specified provider
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            provider_id: ID of the AI provider (e.g., 'gemini', 'openai')
            api_key: API key for the provider
            model: Model name to use
            on_chunk: Callback function for streaming chunks
        """
        try:
            # Map database model_id to provider_id
            provider_id = self._map_model_id_to_provider_id(provider_id)
            provider = self.registry.get_provider(provider_id, api_key, model)
            await provider.stream_chat(messages, on_chunk)
        except Exception as e:
            on_chunk({
                "content": "",
                "isComplete": True,
                "error": f"Provider error: {str(e)}"
            })
    
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        provider_id: str,
        api_key: str,
        model: str
    ) -> str:
        """
        Generate a complete response using the specified provider
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            provider_id: ID of the AI provider
            api_key: API key for the provider
            model: Model name to use
            
        Returns:
            Complete response text
        """
        print("Model information")
        print(provider_id, api_key, model)
        # Map database model_id to provider_id  
        actual_provider_id = self._map_model_id_to_provider_id(provider_id)
        provider = self.registry.get_provider(actual_provider_id, api_key, model)
        return await provider.generate_response(messages)
    
    def get_available_providers(self) -> List[str]:
        """Get list of available provider IDs"""
        return self.registry.get_available_providers()


# Singleton instance
ai_service = AIService()
