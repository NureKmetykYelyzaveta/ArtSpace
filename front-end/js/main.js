const gallery = document.getElementById("gallery");
const commentsModal = document.getElementById("commentsModal");
const closeCommentsModalBtn = document.getElementById("closeCommentsModal");
const modalPostInfo = document.getElementById("modalPostInfo");
const modalCommentsList = document.getElementById("modalCommentsList");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");

const imageModal = document.getElementById("imageModal");
const closeImageModalBtn = document.getElementById("closeImageModal");
const imageModalContent = document.getElementById("imageModalContent");

const uploadPostModal = document.getElementById("uploadPostModal");
const closeUploadPostModalBtn = document.getElementById("closeUploadPostModal");
const cancelUploadPostBtn = document.getElementById("cancelUploadPost");
const uploadPostForm = document.getElementById("uploadPostForm");
const uploadPostImageInput = document.getElementById("uploadPostImageInput");
const uploadPostPreview = document.getElementById("uploadPostPreview");
const uploadPostTitleInput = document.getElementById("uploadPostTitleInput");
const uploadPostCategoryInput = document.getElementById("uploadPostCategoryInput");
const uploadPostTagsInput = document.getElementById("uploadPostTagsInput");
const i18n = window.ArtSpaceI18n;

let currentUser = window.ArtSpaceAuth.requireAuth();
let userProfile = currentUser.profile;

const DEFAULT_AVATAR =
    (window.ArtSpaceAuth && window.ArtSpaceAuth.DEFAULT_AVATAR) ||
    "https://grizly.club/uploads/posts/2023-08/1691270675_grizly-club-p-kartinki-avatarki-bez-fona-55.jpg";

let posts = [];
let activeCommentsPostId = null;
let activeCategories = new Set();
let activeTags = new Set();
let searchQuery = "";

function refreshCurrentUser() {
    currentUser = window.ArtSpaceAuth.requireAuth();
    userProfile = currentUser.profile;
}

function normalizePost(post) {
    return {
        ...post,
        category: post.category || "",
        tags: Array.isArray(post.tags) ? post.tags : [],
        likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
        savedBy: Array.isArray(post.savedBy) ? post.savedBy : [],
        comments: Array.isArray(post.comments) ? post.comments : [],
        likes: Number(post.likes || 0),
        authorNick: post.authorNick || post.author || ""
    };
}

function isPostLikedByCurrentUser(post) {
    return Array.isArray(post.likedBy) && post.likedBy.includes(currentUser._id);
}

function isPostSavedByCurrentUser(post) {
    return Array.isArray(post.savedBy) && post.savedBy.includes(currentUser._id);
}

async function fetchAllPosts() {
    const data = await window.apiRequest("/posts");
    posts = Array.isArray(data) ? data.map(normalizePost) : [];
    renderPosts();
}

async function fetchCommentsByPost(postId) {
    return await window.apiRequest(`/comments/post/${postId}`);
}

async function createComment(postId, text) {
    await window.apiRequest("/comments", {
        method: "POST",
        body: JSON.stringify({
            postId,
            userId: currentUser._id,
            userNick: userProfile.nick,
            userAvatar: userProfile.avatar || DEFAULT_AVATAR,
            text,
            createdAt: new Date().toISOString()
        })
    });
}

async function toggleLikePost(postId) {
    const updatedPost = await window.apiRequest(`/posts/${postId}/like`, {
        method: "PATCH",
        body: JSON.stringify({ userId: currentUser._id })
    });

    const index = posts.findIndex(post => post._id === updatedPost._id);
    if (index !== -1) {
        posts[index] = normalizePost(updatedPost);
    }

    renderPosts();
}

async function toggleSavePost(postId) {
    const updatedPost = await window.apiRequest(`/posts/${postId}/save`, {
        method: "PATCH",
        body: JSON.stringify({ userId: currentUser._id })
    });

    const index = posts.findIndex(post => post._id === updatedPost._id);
    if (index !== -1) {
        posts[index] = normalizePost(updatedPost);
    }

    renderPosts();
}

async function createReport(postId, reason = "Spam") {
    await window.apiRequest("/reports", {
        method: "POST",
        body: JSON.stringify({
            postId,
            userId: currentUser._id,
            reason,
            createdAt: new Date().toISOString()
        })
    });
}

async function createPostApi(payload) {
    await window.apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

function renderHeaderProfile() {
    refreshCurrentUser();

    document.querySelectorAll(".admin-link").forEach(link => {
    link.style.display = currentUser.isAdmin ? "flex" : "none";
});

    document.querySelectorAll(".header-avatar").forEach(img => {
        img.src = userProfile.avatar || DEFAULT_AVATAR;
    });
}

function getFilteredPosts() {
    return posts.filter(post => {
        const categoryMatch =
            activeCategories.size === 0 || activeCategories.has(post.category);

        const tagMatch =
            activeTags.size === 0 ||
            (Array.isArray(post.tags) && post.tags.some(tag => activeTags.has(tag)));

        const normalizedQuery = searchQuery.trim().toLowerCase().replace(/^#/, "");

        const authorMatch = (post.authorNick || "")
            .toLowerCase()
            .replace(/^@/, "")
            .includes(normalizedQuery);

        const titleMatch = (post.title || "")
            .toLowerCase()
            .includes(normalizedQuery);

        const categorySearchMatch = (post.category || "")
            .toLowerCase()
            .includes(normalizedQuery);

        const tagsSearchMatch =
            Array.isArray(post.tags) &&
            post.tags.some(tag =>
                tag.toLowerCase().replace(/^#/, "").includes(normalizedQuery)
            );

        const searchMatch =
            !normalizedQuery ||
            authorMatch ||
            titleMatch ||
            categorySearchMatch ||
            tagsSearchMatch;

        return categoryMatch && tagMatch && searchMatch;
    });
}

function renderPosts() {
    if (!gallery) return;

    gallery.innerHTML = "";

    const filteredPosts = getFilteredPosts();

    if (!filteredPosts.length) {
        gallery.innerHTML = `
            <div class="profile-empty">
                <p>${i18n.t("empty_filtered_posts")}</p>
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
        const commentCount = Number(post.commentsCount || 0);
        const tagsHtml = Array.isArray(post.tags)
            ? post.tags.map(tag => `
                <span class="post-tag ${activeTags.has(tag) ? "active" : ""}" data-tag="${tag}">
                    ${tag}
                </span>
            `).join("")
            : "";

        const liked = isPostLikedByCurrentUser(post);
        const saved = isPostSavedByCurrentUser(post);

        const card = document.createElement("article");
        card.className = "card";
        card.dataset.id = post._id;

        card.innerHTML = `
            <img class="card-image open-post" src="${post.image}" alt="${post.title}" data-post-id="${post._id}">

            <div class="card-content">
                <div class="card-top">
                    <div class="card-title">${post.title}</div>
                    <div class="card-author">${post.authorNick}</div>
                </div>

                <div class="post-meta">
                    <div class="post-category">${post.category || i18n.t("no_category")}</div>
                    <div class="post-tags">${tagsHtml}</div>
                </div>

                <div class="card-actions">
                    <div class="actions-left">
                        <button class="action-btn like-btn ${liked ? "active" : ""}" type="button" data-action="like">
                            <i data-lucide="heart"></i>
                            <span class="like-count">${post.likes}</span>
                        </button>

                        <button class="action-btn comment-btn" type="button" data-action="comment">
                            <i data-lucide="message-circle"></i>
                            <span>${commentCount}</span>
                        </button>
                    </div>

                    <div class="actions-right">
                        <div class="menu-wrapper">
                            <button class="menu-btn" type="button" data-action="menu" aria-label="Меню">
                                <i data-lucide="more-horizontal"></i>
                            </button>

                            <div class="dropdown-menu">
                                <button class="dropdown-item ${saved ? "saved" : ""}" type="button" data-action="save">
                                    <i data-lucide="${saved ? "bookmark-check" : "bookmark"}"></i>
                                    <span>${saved ? i18n.t("saved") : i18n.t("save")}</span>
                                </button>

                                <button class="dropdown-item" type="button" data-action="copy">
                                    <i data-lucide="copy"></i>
                                    <span>${i18n.t("copy_link")}</span>
                                </button>

                                <button class="dropdown-item danger" type="button" data-action="report">
                                    <i data-lucide="flag"></i>
                                    <span>${i18n.t("report")}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        gallery.appendChild(card);
    });

    if (window.lucide) {
        lucide.createIcons();
    }

    paintActiveIcons();
}

function paintActiveIcons() {
    document.querySelectorAll(".like-btn.active .lucide").forEach(icon => {
        icon.style.fill = "currentColor";
    });
}

function closeAllMenus() {
    document.querySelectorAll(".menu-wrapper.open").forEach(wrapper => {
        wrapper.classList.remove("open");
        const btn = wrapper.querySelector(".menu-btn");
        if (btn) btn.classList.remove("active");
    });
}

async function openCommentsModal(postId) {
    const post = posts.find(item => item._id === postId);
    if (!post) return;

    activeCommentsPostId = postId;

    modalPostInfo.innerHTML = `
        <div class="modal-post-title">${post.title}</div>
        <div class="modal-post-author">${post.authorNick}</div>
    `;

    const comments = await fetchCommentsByPost(postId);
    post.comments = Array.isArray(comments) ? comments : [];

    renderComments(post);
    commentsModal.classList.add("open");
    document.body.classList.add("modal-open");

    if (window.lucide) {
        lucide.createIcons();
    }

    setTimeout(() => {
        commentInput.focus();
    }, 50);
}

function closeCommentsModal() {
    commentsModal.classList.remove("open");
    activeCommentsPostId = null;
    commentInput.value = "";

    if (!imageModal.classList.contains("open") && !uploadPostModal.classList.contains("open")) {
        document.body.classList.remove("modal-open");
    }
}

function openImageModal(src, alt) {
    imageModalContent.src = src;
    imageModalContent.alt = alt || "Post image";
    imageModal.classList.add("open");
    document.body.classList.add("modal-open");

    if (window.lucide) {
        lucide.createIcons();
    }
}

function closeImageModal() {
    imageModal.classList.remove("open");
    imageModalContent.src = "";
    imageModalContent.alt = "";

    if (!commentsModal.classList.contains("open") && !uploadPostModal.classList.contains("open")) {
        document.body.classList.remove("modal-open");
    }
}

function openUploadPostModal() {
    if (!uploadPostModal) return;

    uploadPostForm.reset();
    uploadPostPreview.src = "https://placehold.co/500x700/181818/aaaaaa?text=Preview";

    uploadPostModal.classList.add("open");
    document.body.classList.add("modal-open");
}

function closeUploadPostModal() {
    if (!uploadPostModal) return;

    uploadPostModal.classList.remove("open");

    if (!commentsModal.classList.contains("open") && !imageModal.classList.contains("open")) {
        document.body.classList.remove("modal-open");
    }
}

function parseUploadTags(tagsString) {
    return tagsString
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean)
        .map(tag => tag.startsWith("#") ? tag : `#${tag}`);
}

function renderComments(post) {
    const comments = Array.isArray(post.comments) ? post.comments : [];

    if (!comments.length) {
        modalCommentsList.innerHTML = `
            <div class="modal-empty">${i18n.t("comments_empty")}</div>
        `;
        return;
    }

    modalCommentsList.innerHTML = comments
        .map(comment => `
            <div class="modal-comment-item">
                <div class="modal-comment-top">
                    <img class="modal-comment-avatar" src="${comment.userAvatar || DEFAULT_AVATAR}" alt="${comment.userNick}">
                    <div>
                        <div class="modal-comment-user">${comment.userNick}</div>
                        <div class="modal-comment-time">${formatCommentTime(comment.createdAt)}</div>
                    </div>
                </div>
                <div class="modal-comment-text">${comment.text}</div>
            </div>
        `)
        .join("");
}

function formatCommentTime(dateString) {
    if (!dateString) return "щойно";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "щойно";

    return date.toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function setupCategoryFilter() {
    const categoryItems = document.querySelectorAll(".categories li");

    categoryItems.forEach(item => {
        item.addEventListener("click", function () {
            const label = this.querySelector("span");
            const categoryName = label ? label.textContent.trim() : "";

            if (categoryName === "Всі") {
                activeCategories.clear();
                categoryItems.forEach(li => li.classList.remove("active"));
                this.classList.add("active");
                renderPosts();
                return;
            }

            const allItem = Array.from(categoryItems).find(li => {
                const span = li.querySelector("span");
                return span && span.textContent.trim() === "Всі";
            });

            if (allItem) {
                allItem.classList.remove("active");
            }

            if (activeCategories.has(categoryName)) {
                activeCategories.delete(categoryName);
                this.classList.remove("active");
            } else {
                activeCategories.add(categoryName);
                this.classList.add("active");
            }

            if (activeCategories.size === 0 && allItem) {
                allItem.classList.add("active");
            }

            renderPosts();
        });
    });
}

function setupPopularTagsFilter() {
    const tagItems = document.querySelectorAll(".tags span");

    tagItems.forEach(item => {
        item.addEventListener("click", function () {
            const selectedTag = this.textContent.trim();

            if (activeTags.has(selectedTag)) {
                activeTags.delete(selectedTag);
                this.classList.remove("active");
            } else {
                activeTags.add(selectedTag);
                this.classList.add("active");
            }

            renderPosts();
        });
    });
}

renderHeaderProfile();
setupCategoryFilter();
setupPopularTagsFilter();
fetchAllPosts();

document.querySelectorAll(".upload-btn").forEach(button => {
    button.addEventListener("click", openUploadPostModal);
});

if (closeUploadPostModalBtn) {
    closeUploadPostModalBtn.addEventListener("click", closeUploadPostModal);
}

if (cancelUploadPostBtn) {
    cancelUploadPostBtn.addEventListener("click", closeUploadPostModal);
}

if (uploadPostModal) {
    uploadPostModal.addEventListener("click", function (e) {
        if (e.target === uploadPostModal) {
            closeUploadPostModal();
        }
    });
}

if (uploadPostImageInput) {
    uploadPostImageInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            uploadPostPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

if (uploadPostForm) {
    uploadPostForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const title = uploadPostTitleInput.value.trim();
        const category = uploadPostCategoryInput.value.trim();
        const tags = parseUploadTags(uploadPostTagsInput.value);
        const image = uploadPostPreview.src;

        if (!title || !category || !image || image.includes("placehold.co")) {
            return;
        }

                const activeChallenge =
                await window.getActiveChallenge()
                    .catch(() => null);

            await createPostApi({
                title,
                authorId: currentUser._id,
                authorNick: userProfile.nick,
                category,
                tags,
                image,

                challengeId:
                    activeChallenge?._id || null,

                createdAt: new Date().toISOString()
            });

        await fetchAllPosts();
        closeUploadPostModal();
    });
}

document.addEventListener("click", async function (e) {
    const menuBtn = e.target.closest('[data-action="menu"]');
    const actionElement = e.target.closest("[data-action]");
    const tagElement = e.target.closest(".post-tag");
    const card = e.target.closest(".card");
    const insideMenu = e.target.closest(".menu-wrapper");

    if (tagElement) {
        const clickedTag = tagElement.dataset.tag;
        const popularTags = document.querySelectorAll(".tags span");

        if (activeTags.has(clickedTag)) {
            activeTags.delete(clickedTag);
        } else {
            activeTags.add(clickedTag);
        }

        popularTags.forEach(tag => {
            const tagText = tag.textContent.trim();
            tag.classList.toggle("active", activeTags.has(tagText));
        });

        renderPosts();
        return;
    }

    if (menuBtn) {
        const wrapper = menuBtn.closest(".menu-wrapper");
        const isOpen = wrapper.classList.contains("open");

        closeAllMenus();

        if (!isOpen) {
            wrapper.classList.add("open");
            menuBtn.classList.add("active");
        }

        return;
    }

    if (!insideMenu) {
        closeAllMenus();
    }

    if (!card) return;

    const postId = card.dataset.id;
    const post = posts.find(item => item._id === postId);

    if (!post) return;

    if (e.target.closest(".open-post")) {
        openImageModal(post.image, post.title);
        return;
    }

    if (!actionElement) return;

    const action = actionElement.dataset.action;

    try {
        if (action === "like") {
            await toggleLikePost(post._id);
            return;
        }

        if (action === "comment") {
            await openCommentsModal(post._id);
            return;
        }

        if (action === "save") {
            await toggleSavePost(post._id);
            closeAllMenus();
            return;
        }

        if (action === "copy") {
            const link = `https://artspace.com/post/${post._id}`;

            await navigator.clipboard.writeText(link);
            alert(i18n.t("copied"));

            closeAllMenus();
            return;
        }

        if (action === "report") {

    const reason = prompt(
        "Причина скарги:\n\n" +
        "- Spam\n" +
        "- NSFW\n" +
        "- Hate\n" +
        "- Stolen art\n" +
        "- Other"
    );

    if (!reason) return;

    await createReport(post._id, reason);

    alert(`${i18n.t("report_sent")}: "${post.title}"`);

    closeAllMenus();
}
    } catch (error) {
        alert(error.message || "Сталася помилка");
    }
});

if (closeCommentsModalBtn) {
    closeCommentsModalBtn.addEventListener("click", closeCommentsModal);
}

if (closeImageModalBtn) {
    closeImageModalBtn.addEventListener("click", closeImageModal);
}

if (imageModal) {
    imageModal.addEventListener("click", function (e) {
        if (e.target === imageModal) {
            closeImageModal();
        }
    });
}

if (commentsModal) {
    commentsModal.addEventListener("click", function (e) {
        if (e.target === commentsModal) {
            closeCommentsModal();
        }
    });
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        if (uploadPostModal && uploadPostModal.classList.contains("open")) {
            closeUploadPostModal();
            return;
        }

        if (imageModal && imageModal.classList.contains("open")) {
            closeImageModal();
            return;
        }

        if (commentsModal && commentsModal.classList.contains("open")) {
            closeCommentsModal();
        }
    }
});

if (commentForm) {
    commentForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const text = commentInput.value.trim();
        if (!text || activeCommentsPostId === null) return;

        try {
            await createComment(activeCommentsPostId, text);

            commentInput.value = "";
            await fetchAllPosts();
            await openCommentsModal(activeCommentsPostId);
        } catch (error) {
            alert(error.message || "Не вдалося додати коментар");
        }
    });
}

document.querySelectorAll(".join-btn").forEach(button => {
    button.addEventListener("click", function () {
        if (this.textContent === "Join") {
            this.textContent = "Joined";
            this.style.background = "#2a2a2a";
        } else {
            this.textContent = "Join";
            this.style.background = "";
        }
    });
});

if (window.lucide) {
    lucide.createIcons();
}

const searchInput = document.getElementById("searchInput");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        renderPosts();
    });

    searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            const value = searchInput.value.trim();

            if (!value) return;

            window.location.href = `search.html?q=${encodeURIComponent(value)}`;
        }
    });
}

let text = i18n.t("search_placeholder");
let index = 0;
let isDeleting = false;
let typingInterval;
let isSearchFocused = false;

document.addEventListener("languageChanged", () => {
    text = i18n.t("search_placeholder");
    if (searchInput && searchInput.value.trim() === "") {
        index = 0;
        isDeleting = false;
        loopPlaceholder();
    }
});

function loopPlaceholder() {
    if (!searchInput) return;

    clearTimeout(typingInterval);

    if (isSearchFocused) return;

    const currentText = text.substring(0, index);
    searchInput.setAttribute("placeholder", currentText);

    if (!isDeleting && index < text.length) {
        index++;
        typingInterval = setTimeout(loopPlaceholder, 60);
    } else if (!isDeleting && index === text.length) {
        typingInterval = setTimeout(() => {
            isDeleting = true;
            loopPlaceholder();
        }, 1200);
    } else if (isDeleting && index > 0) {
        index--;
        typingInterval = setTimeout(loopPlaceholder, 30);
    } else {
        isDeleting = false;
        typingInterval = setTimeout(loopPlaceholder, 400);
    }
}

if (searchInput) {
    searchInput.addEventListener("focus", () => {
        isSearchFocused = true;
        clearTimeout(typingInterval);
        searchInput.setAttribute("placeholder", "");
    });

    searchInput.addEventListener("blur", () => {
        if (searchInput.value.trim() === "") {
            isSearchFocused = false;
            loopPlaceholder();
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target !== searchInput && !searchInput.contains(e.target)) {
            if (searchInput.value.trim() === "") {
                isSearchFocused = false;
                loopPlaceholder();
            }
        }
    });

    loopPlaceholder();
}
async function loadChallenge() {

    const challengeCard =
        document.getElementById("challengeCard");

    if (!challengeCard) return;

    try {

        const challenge =
            await window.apiRequest(
                "/challenges/active"
            );

        challengeCard.innerHTML = `

    <div class="challenge-label">
        ${i18n.t("challenge_theme")}
    </div>

    <div class="challenge-title">
        ${challenge.title}
    </div>

    <div class="challenge-stats">

        <div class="challenge-stat">

            <span class="challenge-stat-value">
                ${challenge.participantsCount}
            </span>

            <span class="challenge-stat-label">
                ${i18n.t("challenge_participants")}
            </span>

        </div>

        <div class="challenge-stat">

            <span class="challenge-stat-value">
                ${challenge.worksCount}
            </span>

            <span class="challenge-stat-label">
                ${i18n.t("challenge_works_today")}
            </span>

        </div>

    </div>

    <button
        class="challenge-btn"
        onclick="openChallenge('${challenge._id}')"
    >

        <i data-lucide="sparkles"></i>

        <span>
            ${i18n.t("join_challenge")}
        </span>

    </button>
`;

requestAnimationFrame(() => {
    lucide.createIcons();
});

    } catch (error) {

        challengeCard.innerHTML = `
            <div class="challenge-empty">
                ${i18n.t("no_active_challenges")}
            </div>
        `;
    }
}

function openChallenge(challengeId) {

    window.location.href =
        `challenge.html?id=${challengeId}`;
}

async function joinChallenge(challengeId) {

    try {

        await window.apiRequest(
            `/challenges/${challengeId}/join`,
            {
                method: "POST",

                body: JSON.stringify({
                    userId: currentUser._id
                })
            }
        );

        alert("Joined successfully!");

        loadChallenge();

    } catch (error) {

        alert(error.message);
    }
}

i18n.applyTranslations();
i18n.initCustomLanguageDropdown();

loadChallenge();

document.addEventListener("languageChanged", () => {

    i18n.applyTranslations();

    renderPosts();

    loadChallenge();
});


