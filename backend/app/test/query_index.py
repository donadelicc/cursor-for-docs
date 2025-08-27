import os
from typing import Iterable, List, Optional

from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from langchain_openai import AzureOpenAIEmbeddings


def require_env(var_name: str) -> str:
    value = os.getenv(var_name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {var_name}")
    return value


def create_search_client(index_name: str) -> SearchClient:
    endpoint = require_env("AZURE_SEARCH_ENDPOINT")
    key = require_env("AZURE_SEARCH_KEY")
    return SearchClient(endpoint=endpoint, index_name=index_name, credential=AzureKeyCredential(key))


def create_embeddings() -> AzureOpenAIEmbeddings:
    return AzureOpenAIEmbeddings(
        api_version=require_env("AZURE_EMBEDDINGS_API_VERSION"),
        azure_endpoint=require_env("AZURE_EMBEDDINGS_ENDPOINT"),
        api_key=require_env("AZURE_EMBEDDINGS_KEY"),
        deployment=require_env("AZURE_EMBEDDINGS_DEPLOYMENT"),
        chunk_size=1024,
    )


def print_results(header: str, results: Iterable[dict], select_fields: List[str]) -> None:
    print(f"\n=== {header} ===")
    count = 0
    for doc in results:
        count += 1
        pieces: List[str] = []
        for field in select_fields:
            if field in doc and field != "content":
                pieces.append(f"{field}={doc[field]}")
        score = doc.get("@search.score")
        if score is not None:
            pieces.append(f"score={score:.4f}")
        print(" - " + ", ".join(pieces))
        if "content" in doc and isinstance(doc["content"], str):
            snippet = doc["content"].strip().replace("\n", " ")[:300]
            if len(doc["content"]) > 300:
                snippet += "..."
            print(f"   content: {snippet}")
        if count >= 10:
            break
    if count == 0:
        print("(no results)")


def run_keyword_search(client: SearchClient, query: str, k: int, select_fields: List[str], filter_expr: Optional[str]) -> None:
    results = client.search(search_text=query, select=select_fields, filter=filter_expr, top=k)
    print_results("Keyword search", results, select_fields)


def run_vector_search(client: SearchClient, query: str, k: int, select_fields: List[str], filter_expr: Optional[str], embeddings: AzureOpenAIEmbeddings) -> None:
    vector = embeddings.embed_query(query)
    vq = VectorizedQuery(vector=vector, k_nearest_neighbors=k, fields="content_vector")
    results = client.search(search_text=None, vector_queries=[vq], select=select_fields, filter=filter_expr)
    print_results("Vector search", results, select_fields)


def run_hybrid_search(client: SearchClient, query: str, k: int, select_fields: List[str], filter_expr: Optional[str], embeddings: AzureOpenAIEmbeddings) -> None:
    vector = embeddings.embed_query(query)
    vq = VectorizedQuery(vector=vector, k_nearest_neighbors=k, fields="content_vector")
    results = client.search(search_text=query, vector_queries=[vq], select=select_fields, filter=filter_expr, top=k)
    print_results("Hybrid search", results, select_fields)


def main() -> None:
    load_dotenv()

    index_name = os.getenv("AZURE_SEARCH_INDEX_NAME", "documents")
    client = create_search_client(index_name)

    # Show current count
    try:
        count = client.get_document_count()
        print(f"Index '{index_name}' document count: {count}")
    except Exception as exc:
        print(f"Warning: could not fetch document count: {exc}")

    # Hardcoded test configuration
    k = 5
    select_fields = ["id", "title", "source", "content"]
    filter_expr: Optional[str] = None  # e.g., "source eq 'Baron.pdf'"

    # Hardcoded queries
    keyword_query = "hat is the GLOBE program?"
    vector_query = "What does it say about 'universal aspects of leadership'?"
    hybrid_query = "Whats the advice for global executives?"

    # Run keyword search
    run_keyword_search(client, keyword_query, k, select_fields, filter_expr)

    # Prepare embeddings once for vector and hybrid
    embeddings = create_embeddings()

    # Run vector search
    run_vector_search(client, vector_query, k, select_fields, filter_expr, embeddings)

    # Run hybrid search
    run_hybrid_search(client, hybrid_query, k, select_fields, filter_expr, embeddings)


if __name__ == "__main__":
    main()


