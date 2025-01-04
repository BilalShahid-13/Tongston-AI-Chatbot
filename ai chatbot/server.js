import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import cors from "cors";
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

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(cors("*"));

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
  const industryPattern =
    /\b(?:in|for|about|related to|of the|within)\s([a-zA-Z\s]+?)(?:\sindustry|\ssector|$|,|\.)/i;
  const match = query.match(industryPattern);
  return match ? match[1].trim() : null;
};

// Function to ask OpenAI directly
const askOpenAI = async (userQuery) => {
  try {
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

// API endpoint to handle user queries
app.post("/ask", async (req, res) => {
  const { query, industry } = req.body;

  // Update the user's industry if provided
  if (industry) {
    userContext.industry = industry.trim();
  }

  // Extract industry from the query (if mentioned)
  const extractedIndustry = extractIndustryFromQuery(query);
  if (extractedIndustry) {
    userContext.industry = extractedIndustry;
  }

  const filePath = getKnowledgeBaseFilePath(query);

  if (filePath) {
    const extractedText = readTextFile(filePath);

    if (extractedText) {
      const response = await askOpenAIWithTextContent(extractedText, query);
      res.json({ response });
    } else {
      res.json({ response: "Failed to read the knowledge base file." });
    }
  } else {
    const response = await askOpenAI(query);
    res.json({ response });
  }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
