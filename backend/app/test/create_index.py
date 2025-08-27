import os

from dotenv import load_dotenv
from azure.search.documents.indexes.models import (
    ScoringProfile,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SimpleField,
    TextWeights,
)
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores.azuresearch import AzureSearch

# Load environment variables
load_dotenv()


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def main() -> None:
    service_endpoint = require_env("AZURE_SEARCH_ENDPOINT")
    api_key = require_env("AZURE_SEARCH_KEY")
    index_name = "prebentestindex"

    embeddings = AzureOpenAIEmbeddings(
        api_version=require_env("AZURE_EMBEDDINGS_API_VERSION"),
        azure_endpoint=require_env("AZURE_EMBEDDINGS_ENDPOINT"),
        api_key=require_env("AZURE_EMBEDDINGS_KEY"),
        deployment=require_env("AZURE_EMBEDDINGS_DEPLOYMENT"),
        chunk_size=1024,
    )

    embedding_dimensions = len(embeddings.embed_query("Text"))

    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True, filterable=True),
        SearchableField(name="content", type=SearchFieldDataType.String, searchable=True),
        SearchField(
            name="content_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=embedding_dimensions,
            vector_search_profile_name="myHnswProfile",
        ),
        SearchableField(name="metadata", type=SearchFieldDataType.String, searchable=True),
        SearchableField(name="title", type=SearchFieldDataType.String, searchable=True),
        SimpleField(name="source", type=SearchFieldDataType.String, filterable=True),
    ]

    sc_name = "scoring_profile"
    scoring_profile = ScoringProfile(name=sc_name, text_weights=TextWeights(weights={"title": 5}))

    print(f"Creating index '{index_name}' via LangChain AzureSearch helper...")
    AzureSearch(
        azure_search_endpoint=service_endpoint,
        azure_search_key=api_key,
        index_name=index_name,
        embedding_function=embeddings.embed_query,
        fields=fields,
        scoring_profiles=[scoring_profile],
        default_scoring_profile=sc_name,
    )
    print(f"Index '{index_name}' created/verified.")


if __name__ == "__main__":
    main()