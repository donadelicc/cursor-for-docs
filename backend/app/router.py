from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, AsyncGenerator
import os
from dotenv import load_dotenv
import logging
from langchain_core.messages import SystemMessage, HumanMessage
from .auth import get_current_user, get_current_pilot_user # Import your new dependency


# Import our service functions
from .services import (
    ingest_files,
    delete_document_by_name,
    stream_rag_answer,
)
from .config import get_llm_client

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

# Create router instance
router = APIRouter()


# Request/Response Models
class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    query: str

class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    answer: str

# Add documents to the vector store
@router.post("/documents")
async def upload_documents_endpoint(
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_pilot_user)
):
    """
    Endpoint to upload and ingest documents for a specific user.
    """
    # Extract the user_id securely from the verified token
    user_id = current_user["uid"]

    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")

    try:
        processed_count = await ingest_files(files=files, user_id=user_id)
        if processed_count == 0:
            return {"message": "No processable PDF files found.", "files_processed": 0}
            
        return {
            "message": f"Successfully processed and indexed {processed_count} file(s).",
            "files_processed": processed_count
        }
    except Exception as e:
        logger.error(f"Error during document ingestion for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during file processing.")
    
# Conceptual backend endpoint in router.py
@router.delete("/documents/{document_name}")
async def delete_document_endpoint(
    document_name: str,
    current_user: dict = Depends(get_current_pilot_user)
):
    user_id = current_user["uid"]
    
    # Delete the document from the vector store
    success = await delete_document_by_name(
        document_name=document_name, 
        user_id=user_id
    )
    if not success:
        # If the function returns False, it means no documents were found or an error occurred.
        # 404 Not Found is an appropriate response.
        raise HTTPException(
            status_code=404, 
            detail=f"Document '{document_name}' not found for the current user."
        )

    return {"message": f"Document '{document_name}' has been removed successfully."}


# Sources Vector Endpoint
@router.post("/sources", response_model=ChatResponse)
async def sources_vector_endpoint(
    query: str = Form(...),
    current_user: dict = Depends(get_current_pilot_user)
):
    # Extract the user_id securely from the verified token
    user_id = current_user["uid"]

    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")

    try:
        
        response_generator = stream_rag_answer(query=query, user_id=user_id)

        return StreamingResponse(
            response_generator,
            media_type="text/plain; charset=utf-8"
        )

    except Exception as e:
        logger.error(f"Error during chat stream for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while processing your request.")


@router.post("/general")
async def chat_endpoint(request: ChatRequest):
    try:        
        # Validate that the message exists and is not empty
        if not request.query.strip():
            raise HTTPException(
                status_code=400,
                detail="Missing query in request body"
            )
        
        # Initialize the Azure OpenAI model with credentials from environment variables
        model = get_llm_client()

        # Define a concise system prompt for the AI assistant
        system_message = "You are an AI assistant. Answer the user in a professional, concise manner."

        # Construct the message payload for the AI model
        messages = [
            SystemMessage(content=system_message),
            HumanMessage(content=request.query),
        ]

        async def generate_stream() -> AsyncGenerator[str, None]:
            try:
                # Use streaming instead of invoke
                async for chunk in model.astream(messages):
                    if chunk.content and isinstance(chunk.content, str):
                        yield chunk.content
            except Exception as e:
                logger.error(f"Error in streaming AI response: {str(e)}")
                yield f"Error: {str(e)}"

        # Return a streaming response
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain; charset=utf-8"
        )
        
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

# API Endpoints
@router.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Welcome to Useful API",
        "version": "1.0.0",
        "docs": "/docs"
    }
    
@router.get("/ping")
async def ping():
    """Simple ping endpoint for quick health checks."""
    return {"message": "pong"}