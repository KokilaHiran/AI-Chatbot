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

const createMessageElement = (content, classes) => {\
    const div = document.createElement('div');
    div.classList.add('message', ...classes);
    div.innerHTML = content;
    return div;
};

const generateBotResponse = async (incomingMessageDiv) => {
    const message = incomingMessageDiv.querySelector('.message-text').textContent;

    const requestOption = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'},
        body: JSON.stringify({
            contents: [
                { parts: [{ text: userData.message }] },
                ...(userData.file.data ? [{ inline_data: userData.file }] : [])
            ]
        })
    };
};
        