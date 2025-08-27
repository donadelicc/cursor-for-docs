import os
import json
import tempfile
from typing import List, AsyncGenerator
from fastapi import UploadFile

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores.azuresearch import AzureSearch
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from azure.search.documents.indexes import SearchIndexClient
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient


# Import our configurations and clients from config.py
from .config import (
    get_embeddings_client, get_llm_client,
    AZURE_SEARCH_FIELDS, AZURE_SEARCH_SCORING_PROFILE
)

# Connect to our single, persistent index
def get_vector_store_client() -> AzureSearch:
    """Initializes a client to connect to the persistent AzureSearch vector store."""
    # The index name is now static, fetched from your environment config
    index_name = os.environ["AZURE_SEARCH_INDEX_NAME"] 
    embeddings = get_embeddings_client()
    
    return AzureSearch(
        azure_search_endpoint=os.environ["AZURE_SEARCH_ENDPOINT"],
        azure_search_key=os.environ["AZURE_SEARCH_KEY"],
        index_name=index_name,
        embedding_function=embeddings.embed_query,
        fields=AZURE_SEARCH_FIELDS, # This now includes your user_id field
        scoring_profiles=[AZURE_SEARCH_SCORING_PROFILE],
        default_scoring_profile=AZURE_SEARCH_SCORING_PROFILE.name,
    )
    
async def ingest_files(files: List[UploadFile], user_id: str) -> int:
    """Processes and ingests uploaded files into the user's collection in the vector store."""
    
    # Get a client connected to our persistent vector store
    vector_store = get_vector_store_client()
    
    all_chunks = []
    for file in files:
        if file.content_type != "application/pdf":
            continue
        
        original_filename = file.filename
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        loader = PyMuPDFLoader(tmp_file_path)
        docs = loader.load()
        os.remove(tmp_file_path)

        # Add the original filename to each document's metadata before splitting
        for doc in docs:
            doc.metadata["source"] = original_filename

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)
        all_chunks.extend(chunks)

    if not all_chunks:
        return 0

    # We now add the user_id to the metadata of each chunk before final ingestion
    texts_to_add = [chunk.page_content for chunk in all_chunks]
    metadatas_to_add = []
    for chunk in all_chunks:
        # Construct the final metadata object for Azure AI Search
        meta = {
            "source": chunk.metadata.get("source", "Unknown"),
            "title": chunk.metadata.get("source", "Unknown"), # Use filename for title
            "user_id": user_id, # Add the user_id for security filtering
            "metadata": json.dumps({"source": chunk.metadata.get("source", "Unknown"), "page": chunk.metadata.get("page", 0)})
        }
        metadatas_to_add.append(meta)
    
    vector_store.add_texts(texts=texts_to_add, metadatas=metadatas_to_add)
    return len(files) # Return the number of files processed

async def delete_document_by_name(document_name: str, user_id: str) -> bool:
    """
    Finds and deletes all chunks associated with a specific document name
    for a given user from the Azure AI Search index.
    """
    try:
        # 1. Get a client to interact with documents in the index
        index_name = os.environ["AZURE_SEARCH_INDEX_NAME"]
        search_client = SearchClient(
            endpoint=os.environ["AZURE_SEARCH_ENDPOINT"],
            index_name=index_name,
            credential=AzureKeyCredential(os.environ["AZURE_SEARCH_KEY"])
        )

        # 2. Find all chunks to be deleted by filtering on user_id and source (filename)
        # We only need the 'id' field of each chunk to perform the deletion.
        filter_expression = f"user_id eq '{user_id}' and source eq '{document_name}'"
        results = search_client.search(search_text="*", filter=filter_expression, select=["id"])

        # 3. Collect the primary keys of the documents to delete
        documents_to_delete = [{"id": doc["id"]} for doc in results]

        if not documents_to_delete:
            print(f"No documents found for user '{user_id}' with name '{document_name}'. Nothing to delete.")
            return False

        # 4. Perform the delete operation
        result = search_client.delete_documents(documents=documents_to_delete)
        
        # Check if all deletions were successful
        succeeded = all(item.succeeded for item in result)
        if succeeded:
            print(f"Successfully deleted {len(documents_to_delete)} chunks for document '{document_name}'.")
        else:
            # Log any failures for debugging
            for item in result:
                if not item.succeeded:
                    print(f"Failed to delete document with key {item.key}: {item.error_message}")
        
        return succeeded

    except Exception as e:
        print(f"An error occurred during document deletion: {e}")
        return False


async def stream_rag_answer(query: str, user_id: str) -> AsyncGenerator[str, None]:
    """
    Runs the RAG chain and streams the response, filtered for a specific user.
    """
    vector_store = get_vector_store_client()
    
    llm = get_llm_client()
    
    # Use 'filters' in search_kwargs to avoid passing duplicate 'filter' args
    # into the Azure SDK via LangChain's AzureSearch wrapper.
    retriever = vector_store.as_retriever(
        search_type="hybrid",
        search_kwargs={"filters": f"user_id eq '{user_id}'"}
    )
    template = """
    "You are an expert document research assistant that analyzes uploaded PDF source materials to help users understand and extract insights from their documents.\n\n"
    "Your approach:\n"
    "- Analyze only the uploaded source materials provided to you\n"
    "- When multiple sources are uploaded, identify connections, contradictions, or complementary information between them\n"
    "- Always clearly indicate which information comes from which specific source file\n"
    "- Act as a researcher who identifies patterns, themes, and relationships across documents\n"
    "- Provide insights that synthesize information from all available sources\n"
    "- Maintain a scholarly, helpful tone appropriate for academic or professional research\n\n"
    "You excel at analyzing individual documents, comparing information across multiple sources, finding supporting or contradicting evidence, synthesizing complex information, highlighting relevant quotes and data, and identifying key themes and patterns.\n\n"
    "Important guidelines:\n"
    "- Always mention the specific source file name when referencing information\n"
    "- If sources contradict each other, acknowledge and explain the differences clearly  \n"
    "- If information is not available in the uploaded sources, state this explicitly\n"
    "- Never make up information not present in the provided source materials\n"
    "- Focus your analysis exclusively on the content within the uploaded sources\n\n"
    "Provide clear, well-structured responses that help users understand their source materials. Use natural paragraph flow and enhance readability with appropriate markdown formatting:\n\n"
    "Markdown formatting guidelines:\n"
    "- Use **bold text** for author names, key concepts, important topics, and critical findings\n"
    "- Use *italic text* for emphasis, book/document titles, and subtle highlights\n"
    "- Use bullet lists (•) to organize related points, findings, or comparisons\n"
    "- Use numbered lists (1.) for sequential steps, chronological information, or ranked items\n"
    "- Only use formatting when it genuinely improves clarity and readability"

    Cite your sources by referencing the 'source' field from the context.

    CONTEXT:
    {context}

    QUESTION:
    {question}

    ANSWER:
    """
    prompt = ChatPromptTemplate.from_template(template)

    def format_docs(docs):
        return "\n\n".join(f"Source: {doc.metadata['source']}\nContent: {doc.page_content}" for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    # Use .astream() to get an async generator of response chunks
    async for chunk in rag_chain.astream(query):
        yield chunk

def cleanup_session_index(vector_store: AzureSearch):
    """Deletes the temporary index for a user session."""
    try:
        index_name = vector_store._index_name
        
        # Create SearchIndexClient for index management
        index_client = SearchIndexClient(
            endpoint=os.environ["AZURE_SEARCH_ENDPOINT"],
            credential=AzureKeyCredential(os.environ["AZURE_SEARCH_KEY"])
        )
        
        index_client.delete_index(index_name)
        print(f"Successfully deleted temporary index: {index_name}")
    except Exception as e:
        print(f"Error deleting index {vector_store._index_name}: {e}")