import { AzureChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";
import { z } from "zod";
import { JsonOutputParser } from "@langchain/core/output_parsers";

const model = new AzureChatOpenAI({
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT,
});

// Schema for intent analysis response
const intentSchema = z.object({
  intent: z.enum(["replace", "add_after", "add_before"]),
  reasoning: z.string(),
});

// Function to analyze user intent using Azure OpenAI
async function analyzeIntent(
  query: string,
  selectedText: string,
): Promise<"replace" | "add_after" | "add_before"> {
  const parser = new JsonOutputParser();

  const intentAnalysisMessages = [
    new SystemMessage(`You are an expert at analyzing user editing intentions. Your task is to determine what the user wants to do with the selected text based on their query.

Analyze the user's query and selected text to determine the editing intent:

1. **replace**: The user wants to modify, edit, or transform the existing text
   - Examples: "make this more formal", "fix grammar", "translate to Spanish", "rewrite this", "make it shorter"

2. **add_before**: The user wants to create new content that goes BEFORE the selected text, while keeping the original text
   - Examples: "create a header for this paragraph", "add an introduction", "write a title for this", "add a preface"

3. **add_after**: The user wants to create new content that goes AFTER the selected text, while keeping the original text  
   - Examples: "add a conclusion", "write a follow-up paragraph", "create a summary after this", "add more examples"

Key insight: When a user asks to "create a header" or "write a title" for content, they typically want the header/title to appear BEFORE the content while keeping the original content intact.

Return your analysis in the following JSON format:
{
  "intent": "replace" | "add_before" | "add_after",
  "reasoning": "Brief explanation of why you chose this intent"
}`),
    new HumanMessage(`Selected text:
---
${selectedText}
---

User query:
---
${query}
---

Analyze the editing intent and respond with JSON.`),
  ];

  try {
    const response = await model.invoke(intentAnalysisMessages);
    const rawContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    const parsed = await parser.parse(rawContent);
    const validated = intentSchema.parse(parsed);

    console.log(
      `Intent analysis: ${validated.intent} - ${validated.reasoning}`,
    );
    return validated.intent;
  } catch (error) {
    console.error("Error analyzing intent, falling back to replace:", error);
    return "replace"; // Safe fallback
  }
}

export async function POST(req: Request) {
  try {
    const { query, selectedText } = await req.json();

    if (!query || !selectedText) {
      return NextResponse.json(
        { error: "Missing query or selectedText in request body" },
        { status: 400 },
      );
    }

    // Analyze the user's intent
    const intent = await analyzeIntent(query, selectedText);

    // Adjust system message based on intent
    let systemMessage = "";
    const baseFormatting =
      "Use markdown formatting in your response (e.g., **bold**, *italic*, # headings). " +
      "Available formatting: **bold text**, *italic text*, # Heading 1, ## Heading 2, ### Heading 3. " +
      "Return only the content without explanations or conversational filler.";

    if (intent === "replace") {
      systemMessage =
        "You are an expert writing assistant. Your task is to revise and improve the user's selected text based on their query. " +
        "\n\nCRITICAL: When the user asks for formatting changes (like making words bold, italic, etc.), you MUST return the COMPLETE original text with ONLY the requested formatting applied. " +
        "Do not return just the words that were formatted - return the entire text with the formatting changes integrated. " +
        "\n\nFor example:" +
        "\n- If asked to 'make capitalized words bold' in a paragraph, return the ENTIRE paragraph with all capitalized words formatted as **bold**" +
        "\n- If asked to 'make the first sentence italic', return the ENTIRE text with only the first sentence in *italics*" +
        "\n- Always preserve the complete structure and content of the original text" +
        "\n\n" +
        baseFormatting;
    } else if (intent === "add_after") {
      systemMessage =
        "You are an expert writing assistant. The user wants you to create new content that will be added after their selected text. " +
        "Create new content based on their query that complements or continues from the selected text. " +
        baseFormatting;
    } else {
      // add_before
      systemMessage =
        "You are an expert writing assistant. The user wants you to create new content that will be added before their selected text. " +
        "Create new content based on their query that introduces or leads into the selected text. " +
        baseFormatting;
    }

    const messages = [
      new SystemMessage(systemMessage),
      new HumanMessage(
        `Here is the selected text:\n\n---\n${selectedText}\n---\n\n` +
          `Here is my request:\n\n---\n${query}\n---`,
      ),
    ];

    const response = await model.invoke(messages);
    const suggestion = response.content;

    if (typeof suggestion !== "string") {
      throw new Error("AI response was not in the expected string format.");
    }

    return NextResponse.json({ suggestion, intent });
  } catch (error) {
    console.error("Error in AI suggestion API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      {
        error: "Failed to get a suggestion from the AI assistant.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
