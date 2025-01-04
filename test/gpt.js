import fs from "fs";
import readline from "readline";
import { OpenAI } from "openai";
import { config } from "dotenv";
import { prompts } from "../utils/prompts.js"; // Import prompt mappings

// Load environment variables
config();

// Initialize OpenAI API configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAPI_KEY, // Ensure this is set in your .env file
});

// Global user context
const userContext = {
  industry: "", // Store user's industry preference
};

// Function to read a text file
const readTextFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error("Error reading file:", error.message);
    return null;
  }
};

// Function to determine the relevant knowledge base file
const getKnowledgeBaseFilePath = (userQuery) => {
  if (!prompts) return null;
  const query = userQuery.toLowerCase();

  const matchedPrompt = prompts.find((prompt) =>
    prompt.tags.some((tag) => query.includes(tag))
  );

  return matchedPrompt ? matchedPrompt.knowledgeBase : null;
};

// Function to extract industry from the query
const extractIndustryFromQuery = (query) => {
  // Updated regex to capture industry more reliably
  const industryPattern =
    /\b(?:in|for|about|related to|of the|within)\s([a-zA-Z\s]+?)(?:\sindustry|\ssector|$|,|\.)/i;
  const match = query.match(industryPattern);
  return match ? match[1].trim() : null;
};

// Function to ask OpenAI directly
const askOpenAI = async (userQuery) => {
  try {
    // Debug: Log current user context
    console.log(
      "Current industry context:",
      userContext.industry || "not specified"
    );

    const prompt = `
      User's industry: ${userContext.industry || "not specified"}.
      Respond to the following query in the context of their industry:
      "${userQuery}"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error using OpenAI:", error.message);
    return "An error occurred. Please try again.";
  }
};

// Function to query OpenAI using knowledge base content
const askOpenAIWithTextContent = async (extractedText, userQuery) => {
  try {
    const prompt = `
      User's industry: ${userContext.industry || "not specified"}.
      Using the following knowledge base, provide a response to their query:
      "${userQuery}"
      ---
      ${extractedText.slice(0, 4000)}
      ---
      Respond professionally and concisely.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error using OpenAI with text content:", error.message);
    return "An error occurred. Please try again.";
  }
};

// Main chatbot function
const runChatbot = async () => {
  console.log("Hi! I'm your AI assistant. How can I help you today?");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Step 1: Ask for the user's industry
  rl.question("What is your industry? ", (industry) => {
    userContext.industry = industry.trim();
    console.log(`Industry set to: ${userContext.industry}`);

    // Step 2: Start the main interaction loop
    const askQuestion = () => {
      rl.question("Please enter your query: ", async (userQuery) => {
        // Extract industry from the query (if mentioned)
        const extractedIndustry = extractIndustryFromQuery(userQuery);
        if (extractedIndustry) {
          userContext.industry = extractedIndustry;
          console.log(`Industry updated to: ${userContext.industry}`);
        }

        const filePath = getKnowledgeBaseFilePath(userQuery);

        if (filePath) {
          const extractedText = readTextFile(filePath);
          console.log(filePath);
          if (extractedText) {
            const response = await askOpenAIWithTextContent(
              extractedText,
              userQuery
            );
            console.log("\nGPT Response:", response);
          } else {
            console.log("Failed to read the knowledge base file.");
          }
        } else {
          console.log(
            "No relevant knowledge base found. Asking GPT directly..."
          );
          const response = await askOpenAI(userQuery);
          console.log("\nGPT Response:", response);
        }

        askQuestion(); // Continue asking questions
      });
    };

    askQuestion(); // Start the main interaction loop
  });
};

// Run the chatbot
runChatbot();

// What are the best fundraising options for a new business in [industry]?
// What investment opportunities align with my business goals?
// How can I manage cash flow effectively for a startup?
