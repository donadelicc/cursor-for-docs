import os
from openai import AzureOpenAI
from azure.core.credentials import AzureKeyCredential
from langchain_openai import AzureOpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

embeddings = AzureOpenAIEmbeddings(
    api_version=os.environ["AZURE_EMBEDDINGS_API_VERSION"],
    azure_endpoint=os.environ["AZURE_EMBEDDINGS_ENDPOINT"],
    api_key=os.environ["AZURE_EMBEDDINGS_KEY"],
    deployment=os.environ["AZURE_EMBEDDINGS_DEPLOYMENT"],
    chunk_size=1024,
)

response = embeddings.embed_query("first phrase")

print(response)