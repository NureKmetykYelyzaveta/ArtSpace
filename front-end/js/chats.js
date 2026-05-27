const i18n = window.ArtSpaceI18n;
const currentUser = window.ArtSpaceAuth.requireAuth();
const currentUserProfile = currentUser.profile;

const DEFAULT_AVATAR =
    (window.ArtSpaceAuth && window.ArtSpaceAuth.DEFAULT_AVATAR) ||
    "https://grizly.club/uploads/posts/2023-08/1691270675_grizly-club-p-kartinki-avatarki-bez-fona-55.jpg";

const chatsList = document.getElementById("chatsList");
const chatHeader = document.getElementById("chatHeader");
const messagesList = document.getElementById("messagesList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const typingIndicator = document.getElementById("typingIndicator");

let chats = [];
let activeUserId = null;
let activeUser = null;

let heartbeatInterval = null;
let chatRefreshInterval = null;
let typingPollInterval = null;
let typingTimeout = null;
let lastMessagesSignature = "";

function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("userId");
}

function renderHeaderAvatar() {
    document.querySelectorAll(".header-avatar").forEach(img => {
        img.src = currentUserProfile.avatar || DEFAULT_AVATAR;
    });
}

async function heartbeat() {
    try {
        await window.apiRequest(`/users/${currentUser._id}/heartbeat`, {
            method: "PATCH"
        });
    } catch (error) {
        console.error("Heartbeat error:", error);
    }
}

function startHeartbeat() {
    stopHeartbeat();
    heartbeat();
    heartbeatInterval = setInterval(heartbeat, 25000);
}

window.stopHeartbeat = function () {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
};

async function setOffline() {
    try {
        await fetch(`${window.API_BASE_URL}/users/${currentUser._id}/offline`, {
            method: "PATCH",
            keepalive: true,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error("Offline error:", error);
    }
}

async function fetchChats() {
    chats = await window.apiRequest(`/messages/list/${currentUser._id}`);
    renderChatsList();
}

async function fetchUserById(userId) {
    return await window.apiRequest(`/users/${userId}`);
}

async function fetchConversation(userId) {
    return await window.apiRequest(`/messages/conversation/${currentUser._id}/${userId}`);
}

async function sendMessage(userId, text) {
    return await window.apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({
            senderId: currentUser._id,
            receiverId: userId,
            text,
            createdAt: new Date().toISOString()
        })
    });
}

async function setTyping(isTyping) {
    if (!activeUserId) return;

    try {
        await window.apiRequest("/messages/typing", {
            method: "PATCH",
            body: JSON.stringify({
                userId: currentUser._id,
                otherUserId: activeUserId,
                isTyping
            })
        });
    } catch (error) {
        console.error("Typing error:", error);
    }
}

async function checkTyping() {
    if (!activeUserId) return;

    try {
        const result = await window.apiRequest(`/messages/typing/${currentUser._id}/${activeUserId}`);
        if (typingIndicator) {
            typingIndicator.style.display = result.isTyping ? "block" : "none";
            typingIndicator.textContent = result.isTyping ? i18n.t("typing") : "";
        }
    } catch (error) {
        console.error("Typing check error:", error);
    }
}

function startTypingPolling() {
    stopTypingPolling();
    checkTyping();
    typingPollInterval = setInterval(checkTyping, 1500);
}

function stopTypingPolling() {
    if (typingPollInterval) {
        clearInterval(typingPollInterval);
        typingPollInterval = null;
    }
}

function getStatusText(user) {
    if (user?.isOnline) {
        return `<div class="chat-status online">${i18n.t("online")}</div>`;
    }

    return `<div class="chat-status">${i18n.t("offline")}</div>`;
}

function renderChatsList() {
    if (!chatsList) return;

    if (!chats.length) {
        chatsList.innerHTML = `<div class="message-empty">${i18n.t("no_chats")}</div>`;
        return;
    }

    chatsList.innerHTML = chats.map(chat => `
        <div class="chat-user-card ${chat.userId === activeUserId ? "active" : ""}" data-user-id="${chat.userId}">
            <img class="chat-user-avatar" src="${chat.avatar || DEFAULT_AVATAR}" alt="${chat.nick}">
            <div>
                <div class="chat-user-name">${chat.name}</div>
                <div class="chat-user-last">${chat.lastMessage || i18n.t("no_last_message")}</div>
            </div>
        </div>
    `).join("");
}

function renderMessages(messages, forceScroll = false) {
    if (!messagesList) return;

    const newSignature = JSON.stringify(
        messages.map(message => ({
            id: message._id,
            text: message.text,
            senderId: message.senderId
        }))
    );

    if (newSignature === lastMessagesSignature) {
        return;
    }

    lastMessagesSignature = newSignature;

    if (!messages.length) {
        messagesList.innerHTML = `<div class="message-empty">${i18n.t("no_messages")}</div>`;
        return;
    }

    const wasNearBottom =
        messagesList.scrollHeight - messagesList.scrollTop - messagesList.clientHeight < 80;

    messagesList.innerHTML = messages.map(message => `
        <div class="message-item ${message.senderId === currentUser._id ? "me" : "other"}">
            ${message.text}
        </div>
    `).join("");

    if (forceScroll || wasNearBottom) {
        requestAnimationFrame(() => {
            messagesList.scrollTo({
                top: messagesList.scrollHeight,
                behavior: "smooth"
            });
        });
    }
}

async function openChat(userId) {
    activeUserId = userId;
    activeUser = await fetchUserById(userId);

    chatHeader.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
            <img src="${activeUser.profile?.avatar || DEFAULT_AVATAR}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
            <div>
                <div style="font-weight:600;">${activeUser.name}</div>
                <div style="font-size:13px;color:#9e9e9e;">${activeUser.profile?.nick || ""}</div>
                ${getStatusText(activeUser)}
            </div>
        </div>
    `;

    const messages = await fetchConversation(userId);
    renderMessages(messages, true);
    renderChatsList();
    startTypingPolling();
}

async function refreshActiveChat() {
    if (!activeUserId) return;

    try {
        activeUser = await fetchUserById(activeUserId);

        chatHeader.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <img src="${activeUser.profile?.avatar || DEFAULT_AVATAR}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
                <div>
                    <div style="font-weight:600;">${activeUser.name}</div>
                    <div style="font-size:13px;color:#9e9e9e;">${activeUser.profile?.nick || ""}</div>
                    ${getStatusText(activeUser)}
                </div>
            </div>
        `;

        const messages = await fetchConversation(activeUserId);
        renderMessages(messages);
    } catch (error) {
        console.error("Refresh chat error:", error);
    }
}

function startChatRefreshing() {
    stopChatRefreshing();
    chatRefreshInterval = setInterval(async () => {
        await fetchChats();
        await refreshActiveChat();
    }, 3000);
}

function stopChatRefreshing() {
    if (chatRefreshInterval) {
        clearInterval(chatRefreshInterval);
        chatRefreshInterval = null;
    }
}

document.addEventListener("click", async function (e) {
    const chatCard = e.target.closest(".chat-user-card");
    if (!chatCard) return;

    const userId = chatCard.dataset.userId;
    await openChat(userId);
});

if (messageInput) {
    messageInput.addEventListener("input", async () => {
        if (!activeUserId) return;

        await setTyping(true);

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(async () => {
            await setTyping(false);
        }, 1200);
    });
}

if (messageForm) {
    messageForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const text = messageInput.value.trim();
        if (!text || !activeUserId) return;

        await sendMessage(activeUserId, text);
        messageInput.value = "";
        await setTyping(false);

        await fetchChats();
        await openChat(activeUserId);
    });
}

window.addEventListener("beforeunload", () => {
    setOffline();
});

i18n.applyTranslations();
i18n.initLanguageSwitcher();

document.addEventListener("DOMContentLoaded", async () => {
    renderHeaderAvatar();
    startHeartbeat();
    startChatRefreshing();

    await fetchChats();

    const userIdFromUrl = getUserIdFromUrl();

    if (userIdFromUrl) {
        const exists = chats.some(chat => chat.userId === userIdFromUrl);

        if (!exists) {
            const user = await fetchUserById(userIdFromUrl);
            chats.unshift({
                userId: user._id,
                name: user.name,
                nick: user.profile?.nick || "",
                avatar: user.profile?.avatar || DEFAULT_AVATAR,
                lastMessage: ""
            });
            renderChatsList();
        }

        await openChat(userIdFromUrl);
    }
});

document.addEventListener("languageChanged", async () => {
    i18n.applyTranslations();

    if (activeUserId) {
        await openChat(activeUserId);
    } else {
        renderChatsList();
    }
});