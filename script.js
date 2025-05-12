const chatBody = document.querySelector('.chat-body');
const messageInput = document.querySelector('.message-input');
const sendMessageButton = document.querySelector('#send-message');
const fileInput = document.querySelector('#file-input');
const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
const fileCancelButton = document.querySelector('#file-cancel');

const API_KEY = `AIzaSyA9BUSQL_cJfLsKLwxnfkrVUsiDA_PZ1MI`;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

const createMessageElement = (content, classes) => {
    const div = document.createElement('div');
    div.classList.add('message', ...classes);
    div.innerHTML = content;
    return div;
};
  
const generateBotResponse = async (incomingMessageDiv) => {
    // Updated request structure to match Gemini API requirements
    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{ text: userData.message }]
            }]
        })
    };

    // Add image to request if available
    if (userData.file.data) {
        try {
            const contents = JSON.parse(requestOption.body).contents;
            contents[0].parts.push({
                inline_data: {
                    data: userData.file.data,
                    mime_type: userData.file.mime_type
                }
            });
            requestOption.body = JSON.stringify({ contents });
        } catch (error) {
            console.error("Error adding image to request:", error);
        }
    }

    try {
        console.log("Sending request to API:", requestOption);
        const response = await fetch(API_URL, requestOption);
        const data = await response.json();
        console.log("API response:", data);

        if (!response.ok) {
            throw new Error(data.error?.message || 'Error generating response');
        }

        const messageElement = incomingMessageDiv.querySelector('.message-text');
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            const apiResponseText = data.candidates[0].content.parts[0].text;
            messageElement.innerHTML = apiResponseText || "Empty response received";
        } else {
            messageElement.innerHTML = "No valid response from API";
            console.error("Unexpected API response structure:", data);
        }
    } catch (error) {
        console.error('Error generating response:', error);
        incomingMessageDiv.querySelector('.message-text').innerHTML = `Error: ${error.message || "Unknown error"}`;
    } finally {
        userData.file = { data: null, mime_type: null };
        incomingMessageDiv.querySelector('.thinking-indicator')?.remove();
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: 'smooth'});
    }
};

const handleOutgoingMessage = (e) => {
    if (e) {
        e.preventDefault();
    }
    
    userData.message = messageInput.value.trim();

    if (!userData.message) return;
    
    console.log("Sending message:", userData.message);
    messageInput.value = '';
    fileUploadWrapper.classList.remove('has-image');

    // Create and display user message
    const messageElement = `<div class="message-text"></div>${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ''}`;

    const outgoingMessageDiv = createMessageElement(messageElement, ["user-message"]);
    outgoingMessageDiv.querySelector('.message-text').textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({top: chatBody.scrollHeight, behavior: 'smooth'});

    // Show bot typing indicator and generate response
    setTimeout(() => {
        const messageContent = `
            <img src="support_agent_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg" width="25" height="50" />
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>`;

        const incomingMessageDiv = createMessageElement(messageContent, ["bot-message"]);
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: 'smooth'});

        generateBotResponse(incomingMessageDiv);
    }, 500);
};

// Event listeners
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        handleOutgoingMessage(e);
    }
});

sendMessageButton.addEventListener('click', handleOutgoingMessage);

// File handling
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result.split(',')[1];
            userData.file.data = base64Data;
            userData.file.mime_type = file.type;
            
            // Show file preview
            const previewImg = fileUploadWrapper.querySelector('img');
            previewImg.src = URL.createObjectURL(file);
            fileUploadWrapper.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
});

// File upload button click
document.querySelector('#file-upload').addEventListener('click', () => {
    fileInput.click();
});

// File cancel button click
fileCancelButton.addEventListener('click', () => {
    userData.file = { data: null, mime_type: null };
    fileInput.value = '';
    fileUploadWrapper.classList.remove('has-image');
});

// Implementation of emoji picker functionality
document.querySelector('#emoji-picker').addEventListener('click', () => {
    const picker = new EmojiMart.Picker({
        onEmojiSelect: (emoji) => {
            // Insert emoji at cursor position or at the end
            const cursorPosition = messageInput.selectionStart;
            const textBeforeCursor = messageInput.value.substring(0, cursorPosition);
            const textAfterCursor = messageInput.value.substring(cursorPosition);
            
            messageInput.value = textBeforeCursor + emoji.native + textAfterCursor;
            
            // Move cursor position after the inserted emoji
            const newCursorPosition = cursorPosition + emoji.native.length;
            messageInput.setSelectionRange(newCursorPosition, newCursorPosition);
            messageInput.focus();
            
            // Remove emoji picker after selection
            document.querySelector('.emoji-mart')?.remove();
        },
        set: 'native'
    });
    
    // Remove existing picker if any
    document.querySelector('.emoji-mart')?.remove();
    
    // Position the picker near the emoji button
    const emojiButton = document.querySelector('#emoji-picker');
    const rect = emojiButton.getBoundingClientRect();
    
    const pickerElement = picker.element;
    document.body.appendChild(pickerElement);
    
    pickerElement.style.position = 'absolute';
    pickerElement.style.bottom = `${window.innerHeight - rect.top + 10}px`;
    pickerElement.style.left = `${rect.left}px`;
    pickerElement.style.zIndex = '1000';
    
    // Close picker when clicking outside
    document.addEventListener('click', function closeEmojiPicker(e) {
        if (!pickerElement.contains(e.target) && e.target !== emojiButton) {
            document.querySelector('.emoji-mart')?.remove();
            document.removeEventListener('click', closeEmojiPicker);
        }
    });
});

// Make sure file cancel button is hidden by default
document.addEventListener('DOMContentLoaded', () => {
    const fileCancelBtn = document.querySelector('#file-cancel');
    if (fileCancelBtn) {
        fileCancelBtn.style.display = 'none';
    }
    
    // Ensure send button works
    const sendBtn = document.querySelector('#send-message');
    if (sendBtn) {
        sendBtn.addEventListener('click', handleOutgoingMessage);
    }
    
    // Test API connection
    console.log("Chatbot initialized with API URL:", API_URL);
});

// Add debugging tool
window.testChatbot = function() {
    messageInput.value = "Hello, can you help me with something?";
    handleOutgoingMessage();
};

