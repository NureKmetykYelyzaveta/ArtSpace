const savedGallery = document.getElementById("savedGallery");
const savedPostsCount = document.getElementById("savedPostsCount");

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

let allPosts = [];
let activeCommentsPostId = null;

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
    allPosts = Array.isArray(data) ? data.map(normalizePost) : [];
    renderSavedPosts();
}

function getSavedPosts() {
    return allPosts.filter(post => isPostSavedByCurrentUser(post));
}

function renderHeaderProfile() {
    refreshCurrentUser();

    document.querySelectorAll(".header-avatar").forEach(img => {
        img.src = userProfile.avatar || DEFAULT_AVATAR;
    });
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

    const index = allPosts.findIndex(post => post._id === updatedPost._id);
    if (index !== -1) {
        allPosts[index] = normalizePost(updatedPost);
    }

    renderSavedPosts();
}

async function toggleSavePost(postId) {
    const updatedPost = await window.apiRequest(`/posts/${postId}/save`, {
        method: "PATCH",
        body: JSON.stringify({ userId: currentUser._id })
    });

    const index = allPosts.findIndex(post => post._id === updatedPost._id);
    if (index !== -1) {
        allPosts[index] = normalizePost(updatedPost);
    }

    renderSavedPosts();
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

function findPostById(postId) {
    return allPosts.find(post => post._id === postId) || null;
}

function renderSavedPosts() {
    const posts = getSavedPosts();

    if (savedPostsCount) {
        savedPostsCount.textContent = posts.length;
    }

    if (!savedGallery) return;

    savedGallery.innerHTML = "";

    if (!posts.length) {
        savedGallery.innerHTML = `
            <div class="profile-empty">
                <p>${i18n.t("saved_empty")}</p>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }

        return;
    }

    posts.forEach(post => {
        const commentCount = Number(post.commentsCount || 0);
        const tagsHtml = Array.isArray(post.tags)
            ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join("")
            : "";

        const liked = isPostLikedByCurrentUser(post);

        const card = document.createElement("article");
        card.className = "card";
        card.dataset.id = post._id;

        card.innerHTML = `
            <img class="card-image open-post" src="${post.image}" alt="${post.title}" data-post-id="${post._id}">

            <div class="card-content">
                <div class="card-top">
                    <div>
                        <div class="card-title">${post.title}</div>
                        <div class="card-author">${post.authorNick}</div>
                    </div>
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
                                <button class="dropdown-item saved" type="button" data-action="save">
                                    <i data-lucide="bookmark-check"></i>
                                    <span>${i18n.t("saved")}</span>
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

        savedGallery.appendChild(card);
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

function formatCommentTime(dateString) {
    if (!dateString) return "щойно";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "щойно";

    return date.toLocaleString(i18n.getCurrentLanguage() === "uk" ? "uk-UA" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
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

async function openCommentsModal(postId) {
    const post = findPostById(postId);
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
    uploadPostForm.reset();
    uploadPostPreview.src = "https://placehold.co/500x700/181818/aaaaaa?text=Preview";
    uploadPostModal.classList.add("open");
    document.body.classList.add("modal-open");
}

function closeUploadPostModal() {
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

i18n.applyTranslations();
i18n.initLanguageSwitcher();
renderHeaderProfile();
fetchAllPosts();

document.addEventListener("languageChanged", async () => {
    i18n.applyTranslations();
    renderHeaderProfile();
    renderSavedPosts();
});

document.querySelectorAll(".upload-btn").forEach(button => {
    button.addEventListener("click", openUploadPostModal);
});

document.addEventListener("click", async function (e) {
    const menuBtn = e.target.closest('[data-action="menu"]');
    const actionElement = e.target.closest("[data-action]");
    const card = e.target.closest(".card");
    const insideMenu = e.target.closest(".menu-wrapper");

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
    const post = findPostById(postId);

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
            await createReport(post._id, "Spam");
            alert(`${i18n.t("report_sent")}: "${post.title}"`);
            closeAllMenus();
        }
    } catch (error) {
        alert(error.message || i18n.t("auth_error"));
    }
});

if (closeCommentsModalBtn) {
    closeCommentsModalBtn.addEventListener("click", closeCommentsModal);
}

if (closeImageModalBtn) {
    closeImageModalBtn.addEventListener("click", closeImageModal);
}

if (commentsModal) {
    commentsModal.addEventListener("click", function (e) {
        if (e.target === commentsModal) {
            closeCommentsModal();
        }
    });
}

if (imageModal) {
    imageModal.addEventListener("click", function (e) {
        if (e.target === imageModal) {
            closeImageModal();
        }
    });
}

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

        try {
            await createPostApi({
                title,
                authorId: currentUser._id,
                authorNick: userProfile.nick,
                category,
                tags,
                image,
                createdAt: new Date().toISOString()
            });

            await fetchAllPosts();
            closeUploadPostModal();
        } catch (error) {
            alert(error.message || i18n.t("saved_create_error"));
        }
    });
}

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
            alert(error.message || i18n.t("saved_comment_error"));
        }
    });
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        if (uploadPostModal.classList.contains("open")) {
            closeUploadPostModal();
            return;
        }

        if (imageModal.classList.contains("open")) {
            closeImageModal();
            return;
        }

        if (commentsModal.classList.contains("open")) {
            closeCommentsModal();
        }
    }
});

if (window.lucide) {
    lucide.createIcons();
}