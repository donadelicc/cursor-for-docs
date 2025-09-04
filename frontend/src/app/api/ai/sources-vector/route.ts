import { AzureChatOpenAI } from '@langchain/openai';
import { AzureOpenAIEmbeddings } from '@langchain/openai';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from 'langchain/document';

import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { NextResponse } from 'next/server';

const model = new AzureChatOpenAI({
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT,
});

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiEmbeddingsDeploymentName: 'text-embedding-ada-002',
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
});

async function preprocessPDF(file: File): Promise<Document[]> {
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const loader = new WebPDFLoader(file);
    const docs: Document[] = await loader.load();

    // Add filename metadata to each document (preserving Document type)
    const docsWithMetadata: Document[] = docs.map((doc) => {
      // Defensive: ensure doc.metadata exists
      const metadata = {
        ...(doc.metadata || {}),
        source: file.name,
        fileType: 'pdf',
      };
      return new Document({
        pageContent: doc.pageContent,
        metadata,
      });
    });

    // Split documents into chunks, preserving Document[] type
    const allSplits: Document[] = await textSplitter.splitDocuments(docsWithMetadata);
    return allSplits;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF file');
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let query: string;
    const vectorStore = new MemoryVectorStore(embeddings);

    if (contentType.includes('multipart/form-data')) {
      // Handle file uploads with FormData
      const formData = await req.formData();

      query = formData.get('query') as string;

      // Process uploaded PDF files
      const files = formData.getAll('files') as File[];

      for (const file of files) {
        if (file.type === 'application/pdf') {
          try {
            const allSplits = await preprocessPDF(file);
            await vectorStore.addDocuments(allSplits);
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }
      }
    } else {
      // This endpoint only accepts multipart/form-data with uploaded files
      return NextResponse.json(
        {
          error:
            'This endpoint requires uploaded PDF files. Please use multipart/form-data with files.',
        },
        { status: 400 },
      );
    }

    if (!query) {
      return NextResponse.json({ error: 'Missing query in request body' }, { status: 400 });
    }

    const results = await vectorStore.similaritySearch(query);
    const resultsText = results.map((result) => result.pageContent).join('\n');
    console.log(`Vector search returned ${results.length} results for query: "${query}"`);
    console.log(resultsText);

    // Ensure we have meaningful content
    if (results.length === 0) {
      return NextResponse.json(
        {
          error:
            'No relevant content found in the uploaded documents. Please ensure the PDFs contain readable text.',
        },
        { status: 404 },
      );
    }

    // Create system message focused exclusively on uploaded sources
    const systemMessage = `You are an expert document research assistant that analyzes uploaded PDF source materials to help users understand and extract insights from their documents.

Your approach:
- Analyze only the uploaded source materials provided to you
- When multiple sources are uploaded, identify connections, contradictions, or complementary information between them
- Always clearly indicate which information comes from which specific source file
- Act as a researcher who identifies patterns, themes, and relationships across documents
- Provide insights that synthesize information from all available sources
- Maintain a scholarly, helpful tone appropriate for academic or professional research

You excel at analyzing individual documents, comparing information across multiple sources, finding supporting or contradicting evidence, synthesizing complex information, highlighting relevant quotes and data, and identifying key themes and patterns.

Important guidelines:
- Always mention the specific source file name when referencing information
- If sources contradict each other, acknowledge and explain the differences clearly  
- If information is not available in the uploaded sources, state this explicitly
- Never make up information not present in the provided source materials
- Focus your analysis exclusively on the content within the uploaded sources

Provide clear, well-structured responses that help users understand their source materials. Use natural paragraph flow and enhance readability with appropriate markdown formatting:

Markdown formatting guidelines:
- Use **bold text** for author names, key concepts, important topics, and critical findings
- Use *italic text* for emphasis, book/document titles, and subtle highlights
- Use bullet lists (•) to organize related points, findings, or comparisons
- Use numbered lists (1.) for sequential steps, chronological information, or ranked items
- Only use formatting when it genuinely improves clarity and readability`;

    // Construct the human message with only uploaded sources
    const humanMessage = `Here are the uploaded source materials for analysis:

--- UPLOADED SOURCES ---
${resultsText}

--- USER QUESTION ---
${query}

Please provide a comprehensive response based exclusively on the uploaded sources above. Focus your analysis on the content within these source materials and clearly attribute information to specific source files when referencing them.`;

    const messages = [new SystemMessage(systemMessage), new HumanMessage(humanMessage)];

    const response = await model.invoke(messages);
    const answer = response.content;

    if (typeof answer !== 'string') {
      throw new Error('AI response was not in the expected string format.');
    }

    return NextResponse.json({
      answer,
      sourcesProcessed: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in AI sources API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      {
        error: 'Failed to get a response from the AI research assistant.',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
