document.addEventListener('DOMContentLoaded', function () {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistoryList = document.getElementById('chat-history');

    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = content;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        appendMessage('user', message);
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            if (data.response) {
                appendMessage('bot', data.response);
                loadChatHistory();
            } else {
                appendMessage('bot', 'Something went wrong. Please try again.');
            }
        } catch (err) {
            appendMessage('bot', 'Error sending message.');
        }
    }

    async function startNewChat() {
        await fetch('/new_chat', { method: 'POST' });
        chatContainer.innerHTML = '';
        loadChatHistory();
    }

    async function loadChatHistory() {
        try {
            const response = await fetch('/get_chat_history_summary');
            const chats = await response.json();

            chatHistoryList.innerHTML = '';
            chats.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.classList.add('chat-item');
                chatItem.textContent = chat.title + ` (${chat.message_count})`;

                chatItem.addEventListener('click', () => loadChatSession(chat.chat_id));

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑️';
                deleteBtn.classList.add('delete-btn');
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await deleteChatSession(chat.chat_id);
                });

                chatItem.appendChild(deleteBtn);
                chatHistoryList.appendChild(chatItem);
            });
        } catch (err) {
            console.error('Failed to load chat history:', err);
        }
    }

    async function loadChatSession(chatId) {
        try {
            const response = await fetch(`/get_chat_session/${chatId}`);
            const messages = await response.json();

            chatContainer.innerHTML = '';
            messages.forEach(msg => {
                appendMessage(msg.role, msg.content);
            });
        } catch (err) {
            console.error('Failed to load chat session:', err);
        }
    }

    async function deleteChatSession(chatId) {
        try {
            await fetch(`/delete_chat_session/${chatId}`, { method: 'DELETE' });
            loadChatHistory();
            chatContainer.innerHTML = '';
        } catch (err) {
            console.error('Failed to delete chat session:', err);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    newChatBtn.addEventListener('click', startNewChat);

    loadChatHistory();
});
