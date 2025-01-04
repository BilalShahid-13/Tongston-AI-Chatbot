const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

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
    const response = await fetch("http://localhost:5000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    addMessage(data.response); // Add bot's response to the chat box
  } catch (error) {
    console.error("Error:", error);
    addMessage("An error occurred. Please try again.");
  }
}

// Event listener for the send button
sendBtn.addEventListener("click", () => {
  const query = userInput.value.trim();
  if (query) {
    addMessage(query, true); // Add user's message to the chat box
    userInput.value = ""; // Clear the input field
    sendQuery(query); // Send query to the backend
  }
});

// Event listener for the Enter key
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click(); // Trigger the send button click
  }
});
