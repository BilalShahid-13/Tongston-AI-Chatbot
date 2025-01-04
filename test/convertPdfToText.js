import fs from "fs";
import pdfParse from "pdf-parse";

// Function to extract text from a PDF
const extractPDFText = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error reading PDF:", error);
    return null;
  }
};

// Example usage
(async () => {
  const pdfPath =
    "/media/bilal-shahid/New Volume/tongston chatbot/knowledge_base/Is Your Startup Fundable.pdf"; // Update this path if necessary
  const pdfText = await extractPDFText(pdfPath);
  if (pdfText) {
    console.log("Extracted Text:", pdfText);
  }
})();
