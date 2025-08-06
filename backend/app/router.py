from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router instance
router = APIRouter()

# Initialize the Azure OpenAI model with credentials from environment variables
# This setup is done once and reused for all requests
model = AzureChatOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
    temperature=1,
)

####

# Request/Response Models
class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    query: str

class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    answer: str
    secret: str

# API Endpoints
@router.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Welcome to Useful API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
   
    try:        
        # Validate that the message exists and is not empty
        if not request.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Missing query in request body"
            )

        # Define a concise system prompt for the AI assistant
        system_message = "You are an AI assistant. Answer the user in a professional, concise manner."

        # Construct the message payload for the AI model
        messages = [
            SystemMessage(content=system_message),
            HumanMessage(content=request.query),
        ]

        # Send the request to the AI model and wait for the response
        response = await model.ainvoke(messages)
        answer = response.content

        # Ensure the response content is a string before sending it back
        if not isinstance(answer, str):
            raise Exception("AI response was not in the expected string format.")

        return ChatResponse(answer=answer, secret="v2-automated-deployment")
        
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Error in AI chatbot API: {str(e)}")
        
        # Return a detailed error message to the client
        error_message = str(e) if e else "An unknown error occurred."
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to get a response from the AI assistant.",
                "details": error_message,
            }
        )


@router.get("/ping")
async def ping():
    """Simple ping endpoint for quick health checks."""
    return {"message": "pong"}