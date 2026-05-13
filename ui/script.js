const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const welcomeScreen = document.getElementById('welcome-screen');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.querySelector('.sidebar');

// Auto-resize textarea
chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value === '') {
        this.style.height = 'auto';
    }
});

// Sidebar toggle for mobile
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

const GEMINI_API_KEY = "AIzaSyAxB6jfdCsTuXOS4uobTyAt-zT76tKVHIk";
let chatHistory = [];

let activeModel = "gemini-3-flash-preview";

async function fetchGeminiResponse(prompt) {
    try {
        chatHistory.push({
            "role": "user",
            "parts": [{ "text": prompt }]
        });

        const systemInstruction = {
            "parts": [
                {
                    "text": "أنت 'سنيور كلاش'، المساعد الشخصي والخبير للمهندس أحمد حربي. \n" +
                        "قواعدك البرمجية الصارمة:\n" +
                        "1. لا تتصرف أبداً كآلة أو روبوت، ولا تستخدم عبارات مثل 'بصفتي ذكاء اصطناعي'.\n" +
                        "2. تحدث بأسلوب بشري طبيعي جداً، ذكي، وودود كأنك زميل يساعد صديقه.\n" +
                        "3. وظيفتك الأساسية هي 'تبسيط' كل شيء؛ اشرح أعقد المفاهيم بكلمات سهلة وواضحة جداً.\n" +
                        "4. كن مباشراً في حلولك ولا تطل الكلام إلا للفائدة.\n" +
                        "5. صانعك الوحيد هو المهندس/ أحمد حربي (سنيور كلاش). هامة جداً: لا تذكر اسم صانعك أو هويتك تلقائياً، اذكرها فقط إذا سألك المستخدم 'من أنت؟' أو 'من صنعك؟'."
                }
            ]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: systemInstruction,
                contents: chatHistory
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            // If the model wasn't found, reset activeModel to try again next time
            if (data.error.status === "NOT_FOUND") activeModel = null;
            
            // Check for quota exceeded (Rate Limit)
            if (data.error.message.includes("quota") || data.error.status === "RESOURCE_EXHAUSTED" || response.status === 429) {
                return "لقد نفذ رصيدك الحالي يُرجي اعادة الشحن نراك لاحقاََ";
            }

            return "Sorry, I encountered an error: " + data.error.message;
        }

        const aiText = data.candidates[0].content.parts[0].text;

        // Add AI response to history
        chatHistory.push({
            "role": "model",
            "parts": [{ "text": aiText }]
        });

        return aiText;
    } catch (error) {
        console.error("Error fetching from Gemini:", error);
        return "Sorry, there was a problem communicating with the AI server.";
    }
}

let userAvatarDataUrl = null;

function addMessage(text, isAi) {
    // Hide welcome screen if it exists
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isAi ? 'ai' : 'user'}`;

    let avatarContent = isAi ? "<i class='bx bx-brain'></i>" : "U";
    let userStyle = '';
    let customClass = '';

    if (!isAi && userAvatarDataUrl) {
        avatarContent = "";
        userStyle = `style="background-image: url(${userAvatarDataUrl});"`;
        customClass = "custom";
    }

    // Use marked to parse markdown for AI messages
    let formattedText = isAi ? marked.parse(text) : text;

    wrapper.innerHTML = `
        <div class="message-content">
            <div class="msg-avatar ${isAi ? 'ai' : 'user'} ${customClass}" ${userStyle}>${avatarContent}</div>
            <div class="msg-text">${formattedText}</div>
            ${isAi ? `
                <div class="msg-actions">
                    <button onclick="copyMsgText(this)" title="Copy"><i class='bx bx-copy'></i></button>
                    <button title="Like"><i class='bx bx-like'></i></button>
                    <button title="Dislike"><i class='bx bx-dislike'></i></button>
                    <button title="Share"><i class='bx bx-share-alt'></i></button>
                </div>
            ` : ''}
        </div>
    `;

    chatMessages.appendChild(wrapper);
    
    // Highlight code blocks and wrap them in custom containers
    if (isAi) {
        wrapper.querySelectorAll('pre code').forEach((block) => {
            const pre = block.parentNode;
            const container = document.createElement('div');
            container.className = 'code-container';
            const lang = block.className.replace('language-', '') || 'code';
            
            container.innerHTML = `
                <div class="code-header">
                    <span>${lang}</span>
                    <button class="copy-code-btn" onclick="copyCode(this)"><i class='bx bx-copy'></i> Copy code</button>
                </div>
            `;
            
            pre.parentNode.insertBefore(container, pre);
            container.appendChild(pre);
            hljs.highlightElement(block);
        });
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Helper functions for actions
window.copyCode = (btn) => {
    const code = btn.closest('.code-container').querySelector('code').textContent;
    navigator.clipboard.writeText(code);
    btn.innerHTML = "<i class='bx bx-check'></i> Copied!";
    setTimeout(() => {
        btn.innerHTML = "<i class='bx bx-copy'></i> Copy code";
    }, 2000);
};

window.copyMsgText = (btn) => {
    const text = btn.closest('.message-content').querySelector('.msg-text').textContent;
    navigator.clipboard.writeText(text);
    const originalIcon = btn.innerHTML;
    btn.innerHTML = "<i class='bx bx-check'></i>";
    setTimeout(() => { btn.innerHTML = originalIcon; }, 2000);
};

function typeText(element, text, speed) {
    return new Promise(resolve => {
        let i = 0;
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        if (text.length > 0) {
            type();
        } else {
            resolve();
        }
    });
}

async function addMessageAnimated(text) {
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ai`;

    wrapper.innerHTML = `
        <div class="message-content">
            <div class="msg-avatar ai"><i class='bx bx-brain'></i></div>
            <div class="msg-text"></div>
        </div>
    `;

    chatMessages.appendChild(wrapper);
    const msgTextDiv = wrapper.querySelector('.msg-text');

    // For better experience, we type it out as raw text and then parse markdown at the end
    await typeText(msgTextDiv, text, 10);
    
    // Final render with full Markdown support
    msgTextDiv.innerHTML = marked.parse(text);
    
    // Process code blocks for highlighting and containers
    msgTextDiv.querySelectorAll('pre code').forEach((block) => {
        const pre = block.parentNode;
        const container = document.createElement('div');
        container.className = 'code-container';
        const lang = block.className.replace('language-', '') || 'code';
        
        container.innerHTML = `
            <div class="code-header">
                <span>${lang}</span>
                <button class="copy-code-btn" onclick="copyCode(this)"><i class='bx bx-copy'></i> Copy code</button>
            </div>
        `;
        
        pre.parentNode.insertBefore(container, pre);
        container.appendChild(pre);
        hljs.highlightElement(block);
    });

    // Add actions after typing finishes
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    actions.innerHTML = `
        <button onclick="copyMsgText(this)" title="Copy"><i class='bx bx-copy'></i></button>
        <button title="Like"><i class='bx bx-like'></i></button>
        <button title="Dislike"><i class='bx bx-dislike'></i></button>
        <button title="Share"><i class='bx bx-share-alt'></i></button>
    `;
    wrapper.querySelector('.message-content').appendChild(actions);
}

function addThinkingIndicator() {
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ai`;
    wrapper.id = 'typing-indicator-wrapper';

    wrapper.innerHTML = `
        <div class="message-content">
            <div class="msg-avatar ai"><i class='bx bx-brain'></i></div>
            <div class="msg-text">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeThinkingIndicator() {
    const wrapper = document.getElementById('typing-indicator-wrapper');
    if (wrapper) {
        wrapper.remove();
    }
}

async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    // --- NEW DYNAMIC HISTORY LOGIC ---
    const historyList = document.querySelector('.history-list');
    let currentActive = historyList.querySelector('.history-item.active');

    if (!currentActive) {
        const newItem = document.createElement('div');
        newItem.className = 'history-item active new-item-fade';

        // Generate title from text
        let title = text.length > 25 ? text.substring(0, 25) + '...' : text;

        newItem.innerHTML = `<i class='bx bx-message-square-detail'></i> ${title}`;
        historyList.insertBefore(newItem, historyList.firstChild);

        setTimeout(() => {
            newItem.classList.remove('new-item-fade');
        }, 400);

        // Add click listener to make it selectable (simulating chat switch)
        newItem.addEventListener('click', function () {
            const active = historyList.querySelector('.history-item.active');
            if (active) active.classList.remove('active');
            this.classList.add('active');
        });
    }
    // ---------------------------------

    // Add user message
    addMessage(text, false);

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Show thinking indicator
    addThinkingIndicator();

    // Fetch actual AI response
    try {
        const aiResponseText = await fetchGeminiResponse(text);
        removeThinkingIndicator();

        // Re-enable input while AI is typing its response
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();

        await addMessageAnimated(aiResponseText);
    } catch (e) {
        removeThinkingIndicator();
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Event listeners
sendBtn.addEventListener('click', handleSend);

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

let chatCounter = 1;

// New Chat Button
document.querySelector('.new-chat-btn').addEventListener('click', () => {
    chatMessages.innerHTML = '';
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        chatMessages.appendChild(welcomeScreen);
    }

    // Clear chat history for the API
    chatHistory = [];

    const historyList = document.querySelector('.history-list');
    const currentActive = historyList.querySelector('.history-item.active');
    if (currentActive) {
        currentActive.classList.remove('active');
    }
});

// Settings and Avatar Customization
const settingsModal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const avatarInput = document.getElementById('avatar-input');
const sidebarAvatar = document.getElementById('sidebar-avatar');

if (settingsBtn && settingsModal && closeSettingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('open');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('open');
    });

    // Close when clicking outside content
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('open');
        }
    });
    
    // Plus Menu Toggle
    const plusBtn = document.getElementById('plus-btn');
    const plusMenu = document.getElementById('plus-menu');
    if (plusBtn && plusMenu) {
        plusBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            plusMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            plusMenu.classList.remove('show');
        });

        plusMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

if (avatarInput) {
    avatarInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                userAvatarDataUrl = event.target.result;

                // Update sidebar avatar
                sidebarAvatar.style.backgroundImage = `url(${userAvatarDataUrl})`;
                sidebarAvatar.textContent = '';
                sidebarAvatar.classList.add('custom');

                // Update all existing user messages avatars
                const userAvatars = document.querySelectorAll('.msg-avatar.user');
                userAvatars.forEach(av => {
                    av.style.backgroundImage = `url(${userAvatarDataUrl})`;
                    av.textContent = '';
                    av.classList.add('custom');
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

// Rebuilt Sidebar Resizer Logic (Clean & Smooth)
const sidebarRef = document.querySelector('.sidebar');
const resizerRef = document.getElementById('sidebar-resizer');

if (resizerRef && sidebarRef) {
    let m_pos;
    function resize(e) {
        const dx = e.x;
        if (dx >= 200 && dx <= 500) {
            sidebarRef.style.width = dx + "px";
        }
    }

    resizerRef.addEventListener("mousedown", function(e) {
        m_pos = e.x;
        document.body.classList.add('resizing');
        document.addEventListener("mousemove", resize, false);
    }, false);

    document.addEventListener("mouseup", function() {
        document.body.classList.remove('resizing');
        document.removeEventListener("mousemove", resize, false);
    }, false);
}
