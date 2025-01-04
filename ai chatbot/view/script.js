const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const port = 4000;

let userIndustry = ""; // Store the user's industry

// Function to add a message to the chat box
function addMessage(message, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add(isUser ? "user-message" : "bot-message");
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
}

// Function to send user query to the backend
async function sendQuery(query) {
  try {
    const response = await fetch(`http://localhost:${port}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, industry: userIndustry }),
    });

    const data = await response.json();
    addMessage(data.response); // Add bot's response to the chat box
  } catch (error) {
    console.error("Error:", error);
    addMessage("An error occurred. Please try again.");
  }
}

// Function to handle the initial industry input
function handleIndustryInput() {
  const industry = userInput.value.trim();
  if (industry) {
    userIndustry = industry; // Store the user's industry
    addMessage(industry, true); // Add user's industry to the chat box
    userInput.value = ""; // Clear the input field
    userInput.placeholder = "Type your query here..."; // Update placeholder
    addMessage("Thank you! How can I assist you today?"); // Bot's confirmation message
  } else {
    addMessage("Please provide your industry."); // Prompt the user again
  }
}

// Function to handle regular queries
function handleQuery() {
  const query = userInput.value.trim();
  if (query) {
    addMessage(query, true); // Add user's query to the chat box
    userInput.value = ""; // Clear the input field
    sendQuery(query); // Send query to the backend
  }
}

// Initial bot message asking for the user's industry
addMessage("Hi! I'm your AI assistant. What's your industry?");

// Event listener for the send button
sendBtn.addEventListener("click", () => {
  if (!userIndustry) {
    handleIndustryInput(); // Ask for industry if not provided
  } else {
    handleQuery(); // Handle regular queries
  }
});

// Event listener for the Enter key
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    if (!userIndustry) {
      handleIndustryInput(); // Ask for industry if not provided
    } else {
      handleQuery(); // Handle regular queries
    }
  }
});
