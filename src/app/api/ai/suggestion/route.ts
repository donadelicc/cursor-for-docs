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
    const { query, selectedText } = await req.json();

    if (!query || !selectedText) {
      return NextResponse.json({ error: "Missing query or selectedText in request body" }, { status: 400 });
    }

    const messages = [
      new SystemMessage(
        "You are an expert writing assistant. Your task is to revise the user's selected text based on their query. " +
        "Return only the revised text, without any additional explanations, introductions, or conversational filler."
      ),
      new HumanMessage(
        `Here is the text I want you to edit:\n\n---\n${selectedText}\n---\n\n` +
        `Here is my query for how to edit the text:\n\n---\n${query}\n---`
      ),
    ];

    const response = await model.invoke(messages);
    const suggestion = response.content;

    if (typeof suggestion !== 'string') {
      throw new Error("AI response was not in the expected string format.");
    }

    return NextResponse.json({ suggestion });

  } catch (error) {
    console.error("Error in AI suggestion API:", error);
    const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to get a suggestion from the AI assistant.", details: errorMessage }, { status: 500 });
  }
} 