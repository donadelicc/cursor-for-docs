import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from langchain_community.vectorstores.azuresearch import AzureSearch


load_dotenv()

from azure.search.documents.indexes.models import (
    FreshnessScoringFunction,
    FreshnessScoringParameters,
    ScoringProfile,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SimpleField,
    TextWeights,
)

from langchain_openai import AzureOpenAIEmbeddings

embeddings = AzureOpenAIEmbeddings(
    api_version=os.environ["AZURE_EMBEDDINGS_API_VERSION"],
    azure_endpoint=os.environ["AZURE_EMBEDDINGS_ENDPOINT"],
    api_key=os.environ["AZURE_EMBEDDINGS_KEY"],
    deployment=os.environ["AZURE_EMBEDDINGS_DEPLOYMENT"],
    chunk_size=1024,
)


fields = [
    SimpleField(
        name="id",
        type=SearchFieldDataType.String,
        key=True,
        filterable=True,
    ),
    SearchableField(
        name="content",
        type=SearchFieldDataType.String,
        searchable=True,
    ),
    SearchField(
        name="content_vector",
        type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
        searchable=True,
        vector_search_dimensions=len(embeddings.embed_query("Text")),
        vector_search_profile_name="myHnswProfile",
    ),
    SearchableField(
        name="metadata",
        type=SearchFieldDataType.String,
        searchable=True,
    ),
    # Additional field to store the title
    SearchableField(
        name="title",
        type=SearchFieldDataType.String,
        searchable=True,
    ),
    # Additional field for filtering on document source
    SimpleField(
        name="source",
        type=SearchFieldDataType.String,
        filterable=True,
    ),
    # Additional data field for last doc update
    SimpleField(
        name="last_update",
        type=SearchFieldDataType.DateTimeOffset,
        searchable=True,
        filterable=True,
    ),
]
# Adding a custom scoring profile with a freshness function
sc_name = "scoring_profile"
sc = ScoringProfile(
    name=sc_name,
    text_weights=TextWeights(weights={"title": 5}),
    function_aggregation="sum",
    functions=[
        FreshnessScoringFunction(
            field_name="last_update",
            boost=100,
            parameters=FreshnessScoringParameters(boosting_duration="P2D"),
            interpolation="linear",
        )
    ],
)

index_name = "langchain-vector-demo-custom-scoring-profile"

vector_store: AzureSearch = AzureSearch(
    azure_search_endpoint=os.environ["AZURE_SEARCH_ENDPOINT"],
    azure_search_key=os.environ["AZURE_SEARCH_KEY"],
    index_name=index_name,
    embedding_function=embeddings.embed_query,
    fields=fields,
    scoring_profiles=[sc],
    default_scoring_profile=sc_name,
)

# Adding same data with different last_update to show Scoring Profile effect
from datetime import datetime, timedelta

today = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S-00:00")
yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S-00:00")
one_month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime(
    "%Y-%m-%dT%H:%M:%S-00:00"
)

vector_store.add_texts(
    ["Test 1", "Test 1", "Test 1"],
    [
        {
            "title": "Title 1",
            "source": "source1",
            "random": "10290",
            "last_update": today,
        },
        {
            "title": "Title 1",
            "source": "source1",
            "random": "48392",
            "last_update": yesterday,
        },
        {
            "title": "Title 1",
            "source": "source1",
            "random": "32893",
            "last_update": one_month_ago,
        },
    ],
)
res = vector_store.similarity_search(query="Test 1", k=3, search_type="similarity")
print(res)

