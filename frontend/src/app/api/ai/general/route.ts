import { AzureChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { NextResponse } from 'next/server';

// Initialize the Azure OpenAI model with credentials from environment variables.
// This setup is done once and reused for all requests.
const model = new AzureChatOpenAI({
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT,
});

/**
 * Handles POST requests to the API endpoint with streaming responses.
 * It expects a JSON body with a "query" property.
 */
export async function POST(req: Request) {
  try {
    // Extract the user's query from the request body.
    const { query } = await req.json();

    // Validate that the query exists.
    if (!query) {
      return NextResponse.json({ error: 'Missing query in request body' }, { status: 400 });
    }

    // Define a concise system prompt for the AI assistant.
    const systemMessage =
      'You are an AI assistant. Answer the user in a professional, concise manner.';

    // Construct the message payload for the AI model.
    const messages = [new SystemMessage(systemMessage), new HumanMessage(query)];

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
          console.error('Error in streaming AI response:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'An unknown error occurred.';
          const errorText = `Error: ${errorMessage}`;
          const encoded = new TextEncoder().encode(errorText);
          controller.enqueue(encoded);
          controller.close();
        }
      },
    });

    // Return a Response with the stream and appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    // Log the error for debugging purposes.
    console.error('Error in AI chatbot API:', error);

    // Return a generic error message to the client.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

    return NextResponse.json(
      {
        error: 'Failed to get a response from the AI assistant.',
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
