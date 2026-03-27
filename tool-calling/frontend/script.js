const input = document.getElementById('input');
const chatContainer = document.getElementById('chat-container');
const askBtn = document.getElementById('ask');

//threadId to maintain the conversation history
//36 --> radix (base of nymber system)
const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

input?.addEventListener('keyup', handleEnter);

// Function to scroll to bottom
function scrollToBottom() {
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 0);
}

// Function to create loading indicator
function createLoading() {
    const loading = document.createElement('div');
    loading.className = 'my-6 text-gray-400 text-sm animate-pulse';
    loading.textContent = 'Thinking';

    let dotCount = 0;
    const dotInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        loading.textContent = 'Thinking' + '.'.repeat(dotCount);
    }, 500);

    loading.dotInterval = dotInterval;
    return loading;
}

async function generate(text) {
    // User message
    const msg = document.createElement('div');
    msg.className = `my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit`;
    msg.textContent = text;
    chatContainer.appendChild(msg);
    input.value = '';

    // Scroll after user message
    scrollToBottom();

    // Add loading indicator
    const loading = createLoading();
    chatContainer.appendChild(loading);
    scrollToBottom();

    // Call server
    const assistantMessage = await callServer(text);

    // Clear loading animation
    clearInterval(loading.dotInterval);
    loading.remove();

    // Assistant message
    const assistantMsg = document.createElement('div');
    assistantMsg.className = `max-w-fit my-6 bg-neutral-700 p-3 rounded-xl`;
    assistantMsg.textContent = assistantMessage;
    chatContainer.appendChild(assistantMsg);

    // Scroll after assistant message
    scrollToBottom();
}

async function callServer(text) {
    const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({ threadId, message: text }),
    });

    if (!response.ok) {
        console.error('Error calling server: ', response.statusText);
        return 'Error: Could not get response';
    }

    const result = await response.json();
    return result.message;
}

askBtn?.addEventListener('click', async () => {
    const text = input?.value.trim();
    if (!text) {
        return;
    }
    await generate(text);
})

async function handleEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const text = input?.value.trim();
        if (!text) {
            return;
        }
        await generate(text);
    }
}