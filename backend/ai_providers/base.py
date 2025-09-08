from abc import ABC, abstractmethod
from typing import Dict, Any, Callable, List


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
    
    @abstractmethod
    async def stream_chat(
        self, 
        messages: List[Dict[str, str]], 
        on_chunk: Callable[[Dict[str, Any]], None]
    ) -> None:
        """
        Stream chat responses chunk by chunk
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            on_chunk: Callback function that receives chunks in format:
                     {"content": str, "isComplete": bool, "error": str | None}
        """
        pass
    
    @abstractmethod
    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        """
        Generate a complete response (non-streaming)
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            
        Returns:
            Complete response text
        """
        pass


class ProviderRegistry:
    """Registry for managing AI providers"""
    
    _providers: Dict[str, type] = {}
    
    @classmethod
    def register(cls, provider_id: str):
        """Decorator to register a provider"""
        def decorator(provider_class):
            cls._providers[provider_id] = provider_class
            return provider_class
        return decorator
    
    @classmethod
    def get_provider(cls, provider_id: str, api_key: str, model: str) -> AIProvider:
        """Get an instance of the specified provider"""
        if provider_id not in cls._providers:
            raise ValueError(f"Provider '{provider_id}' not found")
        
        return cls._providers[provider_id](api_key, model)
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of available provider IDs"""
        return list(cls._providers.keys())
