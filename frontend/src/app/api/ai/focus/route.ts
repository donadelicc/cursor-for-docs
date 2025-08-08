import { AzureChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";

const model = new AzureChatOpenAI({
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT,
});

export async function POST(req: Request) {
  try {
    const { query, documentContent } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Missing query in request body" },
        { status: 400 },
      );
    }

    // Handle empty document content
    const textToAnalyze = documentContent || "[Empty document]";

    // System message for document research assistant
    const systemMessage = `You are an expert document research assistant. Your role is to help users understand and analyze their documents by answering questions about the content.

Guidelines for your responses:
1. **Document Analysis**: Provide thorough, insightful analysis of the document content
2. **Context-Aware**: Base your answers strictly on the provided document content
3. **Research-Oriented**: Act as a researcher who can identify patterns, themes, key points, and relationships within the text
4. **Helpful Explanations**: Provide clear, well-structured explanations that help users understand their document better
5. **Source References**: When relevant, reference specific parts of the document in your responses
6. **Professional Tone**: Maintain a scholarly, helpful tone appropriate for document analysis

What you can help with:
- Summarizing sections or the entire document
- Identifying key themes, concepts, or arguments
- Explaining complex sections or terminology
- Finding specific information within the document
- Analyzing document structure and organization
- Comparing different sections or ideas within the document
- Providing insights about the document's purpose, audience, or style

What you should NOT do:
- Do not suggest edits or changes to the document (that's for the inline editor)
- Do not make up information not present in the document
- Do not provide general knowledge that isn't related to the document content

Always base your responses on the actual document content provided to you.`;

    const messages = [
      new SystemMessage(systemMessage),
      new HumanMessage(
        `Here is the document content to analyze:\n\n---\n${textToAnalyze}\n---\n\n` +
          `Here is the user's question about the document:\n\n---\n${query}\n---\n\n` +
          `Please provide a helpful, research-focused response based on the document content.`,
      ),
    ];

    // Create a ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use the streaming method instead of invoke
          const streamResponse = await model.stream(messages);
          const textEncoder = new TextEncoder();

          // Iterate through the stream chunks
          for await (const chunk of streamResponse) {
            if (chunk.content && typeof chunk.content === 'string') {
              // Encode the content and push to stream
              const encoded = textEncoder.encode(chunk.content);
              controller.enqueue(encoded);
            }
          }

          // Close the stream when done
          controller.close();
        } catch (error) {
          console.error("Error in streaming AI response:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          const errorText = `Error: ${errorMessage}`;
          const encoded = new TextEncoder().encode(errorText);
          controller.enqueue(encoded);
          controller.close();
        }
      }
    });

    // Return a Response with the stream and appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error("Error in AI main chatbot API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      {
        error: "Failed to get a response from the AI research assistant.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
