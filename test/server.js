import express from "express";
import fs from "fs";
import { OpenAI } from "openai";
import { config } from "dotenv";
import cors from "cors";
import { prompts } from "../utils/prompts.js"; // Import prompt mappings

// Load environment variables
config();

// Initialize OpenAI API configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAPI_KEY, // Ensure this is set in your .env file
});

// Global user context
let userContext = {
  industry: "", // Store user's industry preference
};

// Initialize Express app
const app = express();
app.use(express.json()); // To parse JSON request bodies
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

// API route to set the user's industry
app.post("/set-industry", (req, res) => {
  const { industry } = req.body;
  if (industry) {
    userContext.industry = industry.trim();
    res.json({ message: `Industry set to: ${userContext.industry}` });
  } else {
    res.status(400).json({ message: "Industry is required" });
  }
});

// API route to ask a question
app.post("/ask-question", async (req, res) => {
  const { userQuery } = req.body;
  if (!userQuery) {
    return res.status(400).json({ message: "Query is required" });
  }

  const extractedIndustry = extractIndustryFromQuery(userQuery);
  if (extractedIndustry) {
    userContext.industry = extractedIndustry;
  }

  const filePath = getKnowledgeBaseFilePath(userQuery);

  if (filePath) {
    const extractedText = readTextFile(filePath);
    if (extractedText) {
      const response = await askOpenAIWithTextContent(extractedText, userQuery);
      return res.json({ response });
    } else {
      return res
        .status(500)
        .json({ message: "Failed to read the knowledge base file." });
    }
  } else {
    const response = await askOpenAI(userQuery);
    return res.json({ response });
  }
});

// Start the server
const port = process.env.PORT || 5701;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
