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

    if (!userData.message && !userData.file.data) return;
    
    console.log("Sending message:", userData.message);
    messageInput.value = '';
    
    let messageContent = '';
    
    if (userData.file.data) {
        messageContent = `
            <div class="message-container">
                <div class="message-text">${userData.message}</div>
                <img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />
            </div>`;
    } else {
        messageContent = `<div class="message-text">${userData.message}</div>`;
    }

    const outgoingMessageDiv = createMessageElement(messageContent, ["user-message"]);
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({top: chatBody.scrollHeight, behavior: 'smooth'});
    
    fileUploadWrapper.classList.remove('has-image');

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

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        handleOutgoingMessage(e);
    }
});

sendMessageButton.addEventListener('click', handleOutgoingMessage);

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result.split(',')[1];
            userData.file.data = base64Data;
            userData.file.mime_type = file.type;
            
            const previewImg = fileUploadWrapper.querySelector('img');
            previewImg.src = URL.createObjectURL(file);
            fileUploadWrapper.classList.add('has-image');
            
            messageInput.focus();
        };
        reader.readAsDataURL(file);
    }
});

document.querySelector('#file-upload').addEventListener('click', () => {
    fileInput.click();
});

fileCancelButton.addEventListener('click', () => {
    userData.file = { data: null, mime_type: null };
    fileInput.value = '';
    fileUploadWrapper.classList.remove('has-image');
});

document.querySelector('#emoji-picker').addEventListener('click', async () => {
    document.querySelector('.emoji-picker-container')?.remove();
    
    const container = document.createElement('div');
    container.className = 'emoji-picker-container';
    document.body.appendChild(container);
    
    const emojiButton = document.querySelector('#emoji-picker');
    const rect = emojiButton.getBoundingClientRect();
    
    container.style.position = 'absolute';
    container.style.bottom = `${window.innerHeight - rect.top + 10}px`;
    container.style.left = `${rect.left - 280}px`;
    container.style.zIndex = '1000';
    
    try {
        const { Picker } = window.EmojiMart;
        
        const pickerOptions = {
            onEmojiSelect: (emoji) => {
                const cursorPosition = messageInput.selectionStart;
                const textBeforeCursor = messageInput.value.substring(0, cursorPosition);
                const textAfterCursor = messageInput.value.substring(cursorPosition);
                
                messageInput.value = textBeforeCursor + emoji.native + textAfterCursor;
                
                const newCursorPosition = cursorPosition + emoji.native.length;
                messageInput.setSelectionRange(newCursorPosition, newCursorPosition);
                messageInput.focus();
                
                container.remove();
            },
            theme: 'light',
            set: 'native',
            showSkinTones: false,
            emojiSize: 20,
        };
        
        if (typeof Picker === 'function') {
            const picker = new Picker(pickerOptions);
            container.appendChild(picker);
        } else if (typeof Picker === 'object' && Picker.createElement) {
            container.innerHTML = Picker.createElement(pickerOptions);
        } else {
            const picker = new window.EmojiMart.Picker(pickerOptions);
            container.appendChild(picker.element || picker);
        }
        
        document.addEventListener('click', function closeEmojiPicker(e) {
            if (!container.contains(e.target) && e.target !== emojiButton) {
                container.remove();
                document.removeEventListener('click', closeEmojiPicker);
            }
        });
    } catch (error) {
        console.error("Error initializing emoji picker:", error);
        
        const commonEmojis = ["😀", "😊", "👍", "❤️", "🎉", "👋", "🤔", "😂", "🙏", "👏"];
        
        const simpleList = document.createElement('div');
        simpleList.className = 'simple-emoji-list';
        simpleList.style.backgroundColor = 'white';
        simpleList.style.border = '1px solid #ccc';
        simpleList.style.borderRadius = '8px';
        simpleList.style.padding = '8px';
        simpleList.style.display = 'flex';
        simpleList.style.flexWrap = 'wrap';
        simpleList.style.gap = '10px';
        
        commonEmojis.forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.textContent = emoji;
            emojiButton.style.fontSize = '24px';
            emojiButton.style.background = 'none';
            emojiButton.style.border = 'none';
            emojiButton.style.cursor = 'pointer';
            emojiButton.onclick = () => {
                const cursorPosition = messageInput.selectionStart;
                const textBeforeCursor = messageInput.value.substring(0, cursorPosition);
                const textAfterCursor = messageInput.value.substring(cursorPosition);
                
                messageInput.value = textBeforeCursor + emoji + textAfterCursor;
                messageInput.focus();
                container.remove();
            };
            simpleList.appendChild(emojiButton);
        });
        
        container.appendChild(simpleList);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const fileCancelBtn = document.querySelector('#file-cancel');
    if (fileCancelBtn) {
        fileCancelBtn.style.display = 'none';
    }
    
    const sendBtn = document.querySelector('#send-message');
    if (sendBtn) {
        sendBtn.addEventListener('click', handleOutgoingMessage);
    }
    
    console.log("Chatbot initialized with API URL:", API_URL);
});

window.testChatbot = function() {
    messageInput.value = "Hello, can you help me with something?";
    handleOutgoingMessage();
};

