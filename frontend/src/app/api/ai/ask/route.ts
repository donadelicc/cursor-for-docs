import { AzureChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";

// Initialize the Azure OpenAI model with credentials from environment variables.
// This setup is done once and reused for all requests.
const model = new AzureChatOpenAI({
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT,
});

/**
 * Handles POST requests to the API endpoint.
 * It expects a JSON body with a "query" property.
 */
export async function POST(req: Request) {
  try {
    // Extract the user's query from the request body.
    const { query } = await req.json();

    // Validate that the query exists.
    if (!query) {
      return NextResponse.json(
        { error: "Missing query in request body" },
        { status: 400 },
      );
    }

    // Define a concise system prompt for the AI assistant.
    const systemMessage =
      "You are an AI assistant. Answer the user in a professional, concise manner.";

    // Construct the message payload for the AI model.
    const messages = [
      new SystemMessage(systemMessage),
      new HumanMessage(query),
    ];

    // Send the request to the AI model and wait for the response.
    const response = await model.invoke(messages);
    const answer = response.content;

    // Ensure the response content is a string before sending it back.
    if (typeof answer !== "string") {
      throw new Error("AI response was not in the expected string format.");
    }

    // Return the AI's answer in a JSON response.
    return NextResponse.json({ answer });
  } catch (error) {
    // Log the error for debugging purposes.
    console.error("Error in AI chatbot API:", error);

    // Return a generic error message to the client.
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";

    return NextResponse.json(
      {
        error: "Failed to get a response from the AI assistant.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
