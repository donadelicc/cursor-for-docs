"""
Configuration settings for the Useful API application.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from azure.search.documents.indexes.models import (
    SearchField, SearchFieldDataType, SimpleField, SearchableField,
    ScoringProfile, TextWeights
)
from fastapi import HTTPException
from dotenv import load_dotenv

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Settings
    app_name: str = "Useful API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Azure OpenAI Settings
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_key: Optional[str] = None
    azure_openai_api_version: Optional[str] = None
    azure_openai_deployment: Optional[str] = None
    azure_openai_model_name: Optional[str] = None
    azure_openai_instance_name: Optional[str] = None
    azure_openai_embeddings_endpoint: Optional[str] = None
    azure_openai_embeddings_name: Optional[str] = None
    
    # LangSmith Settings
    langsmith_tracing: Optional[str] = None
    langsmith_endpoint: Optional[str] = None
    langsmith_api_key: Optional[str] = None
    langsmith_project: Optional[str] = None
    
    # CORS Settings
    cors_origins: list[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra fields in .env without errors


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get the global settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

# --- Client Initializations ---

def get_embeddings_client() -> AzureOpenAIEmbeddings:
    """Initializes and returns the Azure OpenAI Embeddings client."""
    load_dotenv()
    try:
        client = AzureOpenAIEmbeddings(
            api_version=os.environ["AZURE_EMBEDDINGS_API_VERSION"],
            azure_endpoint=os.environ["AZURE_EMBEDDINGS_ENDPOINT"],
            api_key=os.environ["AZURE_EMBEDDINGS_KEY"],
            deployment=os.environ["AZURE_EMBEDDINGS_DEPLOYMENT"],
            chunk_size=1,
        )
    except Exception as e:
        print(f"Error initializing Azure OpenAI Embeddings client: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize Azure OpenAI Embeddings client")

    return client

def get_llm_client() -> AzureChatOpenAI:
    """Initializes and returns the Azure OpenAI Chat client."""
    load_dotenv()
    try:
        client = AzureChatOpenAI(
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            deployment_name=os.environ["AZURE_OPENAI_DEPLOYMENT"],
            temperature=1,
        )
        return client
    except Exception as e:
        print(f"Error initializing Azure OpenAI client: {e}")

# --- Azure AI Search Index Schema Definition ---

# Define the fields for your search index
AZURE_SEARCH_FIELDS = [
    SimpleField(name="id", type=SearchFieldDataType.String, key=True),
    SearchableField(name="content", type=SearchFieldDataType.String, searchable=True),
    SearchField(
        name="content_vector",
        type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
        searchable=True,
        vector_search_dimensions=3072,
        vector_search_profile_name="myHnswProfile",
    ),
    SearchableField(name="metadata", type=SearchFieldDataType.String, searchable=True, retrievable=True),
    SearchableField(name="title", type=SearchFieldDataType.String, searchable=True, retrievable=True),
    SimpleField(name="source", type=SearchFieldDataType.String, filterable=True, retrievable=True),
    SimpleField(name="user_id", type=SearchFieldDataType.String, filterable=True, retrievable=True),
]

# Define a scoring profile to boost relevance of matches in the 'title' field
AZURE_SEARCH_SCORING_PROFILE = ScoringProfile(
    name="scoring_profile",
    text_weights=TextWeights(weights={"title": 5}),
)

# Note: Vector search configuration is automatically handled by LangChain's AzureSearch class
# The profile "myHnswProfile" is created automatically when using LangChain