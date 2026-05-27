const profileGallery = document.getElementById("profileGallery");

const commentsModal = document.getElementById("commentsModal");
const closeCommentsModalBtn = document.getElementById("closeCommentsModal");
const modalPostInfo = document.getElementById("modalPostInfo");
const modalCommentsList = document.getElementById("modalCommentsList");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");

const imageModal = document.getElementById("imageModal");
const closeImageModalBtn = document.getElementById("closeImageModal");
const imageModalContent = document.getElementById("imageModalContent");

const editProfileModal = document.getElementById("editProfileModal");
const openEditProfileModalBtn = document.getElementById("openEditProfileModal");
const closeEditProfileModalBtn = document.getElementById("closeEditProfileModal");
const cancelEditProfileBtn = document.getElementById("cancelEditProfile");

const editProfileForm = document.getElementById("editProfileForm");
const editAvatarInput = document.getElementById("editAvatarInput");
const editAvatarPreview = document.getElementById("editAvatarPreview");
const editNameInput = document.getElementById("editNameInput");
const editNickInput = document.getElementById("editNickInput");
const editBioInput = document.getElementById("editBioInput");
const removeAvatarBtn = document.getElementById("removeAvatarBtn");
const messageBtn = document.getElementById("messageBtn");

const editPostModal = document.getElementById("editPostModal");
const closeEditPostModalBtn = document.getElementById("closeEditPostModal");
const cancelEditPostBtn = document.getElementById("cancelEditPost");
const editPostForm = document.getElementById("editPostForm");
const editPostPreview = document.getElementById("editPostPreview");
const editPostTitleInput = document.getElementById("editPostTitleInput");
const editPostCategoryInput = document.getElementById("editPostCategoryInput");
const editPostTagsInput = document.getElementById("editPostTagsInput");

const uploadPostModal = document.getElementById("uploadPostModal");
const closeUploadPostModalBtn = document.getElementById("closeUploadPostModal");
const cancelUploadPostBtn = document.getElementById("cancelUploadPost");
const uploadPostForm = document.getElementById("uploadPostForm");
const uploadPostImageInput = document.getElementById("uploadPostImageInput");
const uploadPostPreview = document.getElementById("uploadPostPreview");
const uploadPostTitleInput = document.getElementById("uploadPostTitleInput");
const uploadPostCategoryInput = document.getElementById("uploadPostCategoryInput");
const uploadPostTagsInput = document.getElementById("uploadPostTagsInput");
const followBtn = document.getElementById("followBtn");
const i18n = window.ArtSpaceI18n;

const DEFAULT_AVATAR =
    (window.ArtSpaceAuth && window.ArtSpaceAuth.DEFAULT_AVATAR) ||
    "https://grizly.club/uploads/posts/2023-08/1691270675_grizly-club-p-kartinki-avatarki-bez-fona-55.jpg";

let currentUser = window.ArtSpaceAuth.requireAuth();
let currentUserProfile = currentUser.profile;

let viewedUserId = null;
let viewedUser = null;
let viewedUserProfile = null;
let isOwnProfile = true;

let allPosts = [];
let activeCommentsPostId = null;
let activeEditPostId = null;

function refreshCurrentUser() {
    currentUser = window.ArtSpaceAuth.requireAuth();
    currentUserProfile = currentUser.profile;
}

function getViewedUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("userId");
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

function updateProfileUiVisibility() {
    if (openEditProfileModalBtn) {
        openEditProfileModalBtn.style.display = isOwnProfile ? "" : "none";
    }

    document.querySelectorAll(".upload-btn").forEach(button => {
        button.style.display = isOwnProfile ? "" : "none";
    });

    document.querySelectorAll(".profile-nav-link").forEach(link => {
        const text = link.textContent.trim().toLowerCase();

        if (!isOwnProfile && (text.includes("збережені") || text.includes("налаштування"))) {
            link.style.display = "none";
        }
    });
}

async function fetchViewedUser() {
    refreshCurrentUser();

    const userIdFromUrl = getViewedUserIdFromUrl();
    viewedUserId = userIdFromUrl || currentUser._id;
    isOwnProfile = viewedUserId === currentUser._id;

    if (isOwnProfile) {
        viewedUser = currentUser;
        viewedUserProfile = currentUser.profile;
        updateProfileUiVisibility();
        return;
    }

    viewedUser = await window.apiRequest(`/users/${viewedUserId}`);
    viewedUserProfile = viewedUser.profile;
    updateProfileUiVisibility();
}

async function fetchUserPosts() {
    const data = await window.apiRequest(`/posts/author/${viewedUserId}`);
    allPosts = Array.isArray(data) ? data.map(normalizePost) : [];
    renderProfilePosts();
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
            userNick: currentUserProfile.nick,
            userAvatar: currentUserProfile.avatar || DEFAULT_AVATAR,
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

    renderProfilePosts();
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

    renderProfilePosts();
}

async function updatePostApi(postId, payload) {
    const updatedPost = await window.apiRequest(`/posts/${postId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });

    const index = allPosts.findIndex(post => post._id === updatedPost._id);
    if (index !== -1) {
        allPosts[index] = normalizePost(updatedPost);
    }

    renderProfilePosts();
}

async function deletePostApi(postId) {
    await window.apiRequest(`/posts/${postId}`, {
        method: "DELETE"
    });

    allPosts = allPosts.filter(post => post._id !== postId);
    renderProfilePosts();
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
    const createdPost = await window.apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    allPosts.unshift(normalizePost(createdPost));
    renderProfilePosts();
}

function getUserPosts() {
    return allPosts;
}

function findUserPostById(postId) {
    return allPosts.find(post => post._id === postId) || null;
}

function renderProfileInfo() {
    const profileName = document.getElementById("profileName");
    const profileNick = document.getElementById("profileNick");
    const profileBio = document.getElementById("profileBio");
    const profileAvatar = document.getElementById("profileAvatar");

    const postsCount = document.getElementById("postsCount");
    const likesCountEl = document.getElementById("likesCount");
    const followersCountEl = document.getElementById("followersCount");

    const activeProfile = viewedUserProfile || currentUserProfile;
    const currentAvatar = activeProfile.avatar || DEFAULT_AVATAR;
    const userPosts = getUserPosts();
    const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const followersCount = Array.isArray(viewedUser?.followers) ? viewedUser.followers.length : 0;

    if (profileName) profileName.textContent = viewedUser?.name || currentUser.name;
    if (profileNick) profileNick.textContent = activeProfile.nick;
    if (profileBio) profileBio.textContent = activeProfile.bio || i18n.t("profile_default_bio");
    if (profileAvatar) profileAvatar.src = currentAvatar;

    if (postsCount) postsCount.textContent = userPosts.length;
    if (likesCountEl) likesCountEl.textContent = totalLikes;
    if (followersCountEl) followersCountEl.textContent = followersCount;

    document.querySelectorAll(".header-avatar").forEach(img => {
        img.src = currentUserProfile.avatar || DEFAULT_AVATAR;
    });
}

function renderProfilePosts() {
    if (!profileGallery) return;

    const userPosts = getUserPosts();

    if (!userPosts.length) {
        profileGallery.innerHTML = `
            <div class="profile-empty">
                <p>${i18n.t("profile_no_posts")}</p>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }

        renderProfileInfo();
        return;
    }

    profileGallery.innerHTML = "";

    userPosts.forEach(post => {
        const commentCount = Number(post.commentsCount || 0);
        const tagsHtml = Array.isArray(post.tags)
            ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join("")
            : "";

        const liked = isPostLikedByCurrentUser(post);
        const saved = isPostSavedByCurrentUser(post);

        const ownActionsHtml = isOwnProfile ? `
            <button class="dropdown-item" type="button" data-action="edit-post">
                <i data-lucide="pencil"></i>
                <span>${i18n.t("edit")}</span>
            </button>

            <button class="dropdown-item danger" type="button" data-action="delete-post">
                <i data-lucide="trash-2"></i>
                <span>${i18n.t("delete")}</span>
            </button>
        ` : "";

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
                                <button class="dropdown-item ${saved ? "saved" : ""}" type="button" data-action="save">
                                    <i data-lucide="${saved ? "bookmark-check" : "bookmark"}"></i>
                                    <span>${saved ? i18n.t("saved") : i18n.t("save")}</span>
                                </button>

                                <button class="dropdown-item" type="button" data-action="copy">
                                    <i data-lucide="copy"></i>
                                    <span>${i18n.t("copy_link")}</span>
                                </button>

                                ${ownActionsHtml}

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

        profileGallery.appendChild(card);
    });

    if (window.lucide) {
        lucide.createIcons();
    }

    paintProfileActiveIcons();
    renderProfileInfo();
}

function paintProfileActiveIcons() {
    document.querySelectorAll("#profileGallery .like-btn.active .lucide").forEach(icon => {
        icon.style.fill = "currentColor";
    });
}

function closeAllProfileMenus() {
    document.querySelectorAll("#profileGallery .menu-wrapper.open").forEach(wrapper => {
        wrapper.classList.remove("open");
        const btn = wrapper.querySelector(".menu-btn");
        if (btn) btn.classList.remove("active");
    });
}

function renderComments(post) {
    if (!modalCommentsList) return;

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
    const post = findUserPostById(postId);
    if (!post || !commentsModal) return;

    activeCommentsPostId = postId;

    if (modalPostInfo) {
        modalPostInfo.innerHTML = `
            <div class="modal-post-title">${post.title}</div>
            <div class="modal-post-author">${post.authorNick}</div>
        `;
    }

    const comments = await fetchCommentsByPost(postId);
    post.comments = Array.isArray(comments) ? comments : [];

    renderComments(post);
    commentsModal.classList.add("open");
    document.body.classList.add("modal-open");

    if (window.lucide) {
        lucide.createIcons();
    }

    if (commentInput) {
        setTimeout(() => {
            commentInput.focus();
        }, 50);
    }
}

function closeCommentsModal() {
    if (!commentsModal) return;

    commentsModal.classList.remove("open");
    activeCommentsPostId = null;

    if (commentInput) {
        commentInput.value = "";
    }

    if (
        (!imageModal || !imageModal.classList.contains("open")) &&
        (!editProfileModal || !editProfileModal.classList.contains("open")) &&
        (!editPostModal || !editPostModal.classList.contains("open")) &&
        (!uploadPostModal || !uploadPostModal.classList.contains("open"))
    ) {
        document.body.classList.remove("modal-open");
    }
}

function openImageModal(src, alt) {
    if (!imageModal || !imageModalContent) return;

    imageModalContent.src = src;
    imageModalContent.alt = alt || "Post image";
    imageModal.classList.add("open");
    document.body.classList.add("modal-open");
}

function closeImageModal() {
    if (!imageModal || !imageModalContent) return;

    imageModal.classList.remove("open");
    imageModalContent.src = "";
    imageModalContent.alt = "";

    if (
        (!commentsModal || !commentsModal.classList.contains("open")) &&
        (!editProfileModal || !editProfileModal.classList.contains("open")) &&
        (!editPostModal || !editPostModal.classList.contains("open")) &&
        (!uploadPostModal || !uploadPostModal.classList.contains("open"))
    ) {
        document.body.classList.remove("modal-open");
    }
}

function openEditProfileModal() {
    if (!editProfileModal || !isOwnProfile) return;

    refreshCurrentUser();

    editNameInput.value = currentUser.name || "";
    editNickInput.value = currentUserProfile.nick || "";
    editBioInput.value = currentUserProfile.bio || "";
    editAvatarPreview.src = currentUserProfile.avatar || DEFAULT_AVATAR;

    editProfileModal.classList.add("open");
    document.body.classList.add("modal-open");
}

function closeEditProfileModal() {
    if (!editProfileModal) return;

    editProfileModal.classList.remove("open");

    if (
        (!commentsModal || !commentsModal.classList.contains("open")) &&
        (!imageModal || !imageModal.classList.contains("open")) &&
        (!editPostModal || !editPostModal.classList.contains("open")) &&
        (!uploadPostModal || !uploadPostModal.classList.contains("open"))
    ) {
        document.body.classList.remove("modal-open");
    }
}

function openEditPostModal(postId) {
    if (!isOwnProfile) return;

    const post = findUserPostById(postId);
    if (!post || !editPostModal) return;

    activeEditPostId = postId;

    if (editPostPreview) editPostPreview.src = post.image;
    if (editPostTitleInput) editPostTitleInput.value = post.title || "";
    if (editPostCategoryInput) editPostCategoryInput.value = post.category || "";
    if (editPostTagsInput) editPostTagsInput.value = Array.isArray(post.tags) ? post.tags.join(", ") : "";

    editPostModal.classList.add("open");
    document.body.classList.add("modal-open");
}

function closeEditPostModal() {
    if (!editPostModal) return;

    editPostModal.classList.remove("open");
    activeEditPostId = null;

    if (
        (!commentsModal || !commentsModal.classList.contains("open")) &&
        (!imageModal || !imageModal.classList.contains("open")) &&
        (!editProfileModal || !editProfileModal.classList.contains("open")) &&
        (!uploadPostModal || !uploadPostModal.classList.contains("open"))
    ) {
        document.body.classList.remove("modal-open");
    }
}

function openUploadPostModal() {
    if (!uploadPostModal || !isOwnProfile) return;

    uploadPostForm.reset();
    uploadPostPreview.src = "https://placehold.co/500x700/181818/aaaaaa?text=Preview";

    uploadPostModal.classList.add("open");
    document.body.classList.add("modal-open");
}

function closeUploadPostModal() {
    if (!uploadPostModal) return;

    uploadPostModal.classList.remove("open");

    if (
        (!commentsModal || !commentsModal.classList.contains("open")) &&
        (!imageModal || !imageModal.classList.contains("open")) &&
        (!editProfileModal || !editProfileModal.classList.contains("open")) &&
        (!editPostModal || !editPostModal.classList.contains("open"))
    ) {
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

function parseTags(tagsString) {
    return tagsString
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean)
        .map(tag => tag.startsWith("#") ? tag : `#${tag}`);
}

async function deletePost(postId) {
    if (!isOwnProfile) return;

    const post = findUserPostById(postId);
    if (!post) return;

    const confirmed = confirm(`${i18n.t("delete_post_confirm")} "${post.title}"?`);
    if (!confirmed) return;

    await deletePostApi(postId);
    closeAllProfileMenus();

    if (activeCommentsPostId === postId) {
        closeCommentsModal();
    }

    if (activeEditPostId === postId) {
        closeEditPostModal();
    }
}

document.addEventListener("click", async function (e) {
    const profileCard = e.target.closest("#profileGallery .card");
    const menuBtn = e.target.closest('#profileGallery [data-action="menu"]');
    const actionElement = e.target.closest("#profileGallery [data-action]");
    const insideMenu = e.target.closest("#profileGallery .menu-wrapper");

    if (menuBtn) {
        const wrapper = menuBtn.closest(".menu-wrapper");
        const isOpen = wrapper.classList.contains("open");

        closeAllProfileMenus();

        if (!isOpen) {
            wrapper.classList.add("open");
            menuBtn.classList.add("active");
        }

        return;
    }

    if (!insideMenu) {
        closeAllProfileMenus();
    }

    if (!profileCard) return;

    const postId = profileCard.dataset.id;
    const post = findUserPostById(postId);

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
            closeAllProfileMenus();
            return;
        }

        if (action === "copy") {
            const link = `https://artspace.com/post/${post._id}`;
            await navigator.clipboard.writeText(link);
            alert(i18n.t("copied"));
            closeAllProfileMenus();
            return;
        }

        if (action === "edit-post") {
            if (!isOwnProfile) return;
            openEditPostModal(post._id);
            closeAllProfileMenus();
            return;
        }

        if (action === "delete-post") {
            if (!isOwnProfile) return;
            await deletePost(post._id);
            return;
        }

        if (action === "report") {
            await createReport(post._id, "Spam");
            alert(`${i18n.t("report_sent")}: "${post.title}"`);
            closeAllProfileMenus();
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

if (openEditProfileModalBtn) {
    openEditProfileModalBtn.addEventListener("click", openEditProfileModal);
}

if (closeEditProfileModalBtn) {
    closeEditProfileModalBtn.addEventListener("click", closeEditProfileModal);
}

if (cancelEditProfileBtn) {
    cancelEditProfileBtn.addEventListener("click", closeEditProfileModal);
}

if (closeEditPostModalBtn) {
    closeEditPostModalBtn.addEventListener("click", closeEditPostModal);
}

if (cancelEditPostBtn) {
    cancelEditPostBtn.addEventListener("click", closeEditPostModal);
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

if (editProfileModal) {
    editProfileModal.addEventListener("click", function (e) {
        if (e.target === editProfileModal) {
            closeEditProfileModal();
        }
    });
}

if (editPostModal) {
    editPostModal.addEventListener("click", function (e) {
        if (e.target === editPostModal) {
            closeEditPostModal();
        }
    });
}

if (uploadPostModal) {
    uploadPostModal.addEventListener("click", function (e) {
        if (e.target === uploadPostModal) {
            closeUploadPostModal();
        }
    });
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        if (uploadPostModal && uploadPostModal.classList.contains("open")) {
            closeUploadPostModal();
            return;
        }

        if (editPostModal && editPostModal.classList.contains("open")) {
            closeEditPostModal();
            return;
        }

        if (editProfileModal && editProfileModal.classList.contains("open")) {
            closeEditProfileModal();
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
            await fetchUserPosts();
            await openCommentsModal(activeCommentsPostId);
        } catch (error) {
            alert(error.message || i18n.t("comment_add_error"));
        }
    });
}

if (editAvatarInput) {
    editAvatarInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            editAvatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", function () {
        editAvatarPreview.src = DEFAULT_AVATAR;
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!isOwnProfile) return;

        try {
            const result = await window.ArtSpaceAuth.updateCurrentUserProfile({
                name: editNameInput.value.trim() || currentUser.name,
                nick: editNickInput.value.trim() || currentUserProfile.nick,
                bio: editBioInput.value.trim(),
                avatar: editAvatarPreview.src || DEFAULT_AVATAR
            });

            if (!result) return;

            currentUser = result.user;
            currentUserProfile = currentUser.profile;
            viewedUser = currentUser;
            viewedUserProfile = currentUser.profile;

            renderProfileInfo();
            await fetchUserPosts();
            closeEditProfileModal();
        } catch (error) {
            alert(error.message || i18n.t("profile_update_error"));
        }
    });
}

if (editPostForm) {
    editPostForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!isOwnProfile || activeEditPostId === null) return;

        const post = findUserPostById(activeEditPostId);
        if (!post) return;

        try {
            await updatePostApi(activeEditPostId, {
                title: editPostTitleInput.value.trim() || post.title,
                category: editPostCategoryInput.value.trim(),
                tags: parseTags(editPostTagsInput.value)
            });

            closeEditPostModal();
        } catch (error) {
            alert(error.message || i18n.t("post_update_error"));
        }
    });
}

document.querySelectorAll(".upload-btn").forEach(button => {
    button.addEventListener("click", openUploadPostModal);
});

if (closeUploadPostModalBtn) {
    closeUploadPostModalBtn.addEventListener("click", closeUploadPostModal);
}

if (cancelUploadPostBtn) {
    cancelUploadPostBtn.addEventListener("click", closeUploadPostModal);
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

        if (!isOwnProfile) return;

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
                authorNick: currentUserProfile.nick,
                category,
                tags,
                image,
                createdAt: new Date().toISOString()
            });

            closeUploadPostModal();
        } catch (error) {
            alert(error.message || i18n.t("post_create_error"));
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await fetchViewedUser();
        renderProfileInfo();
        renderFollowButton();
        renderMessageButton();
        await fetchUserPosts();

        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (error) {
        alert(error.message || i18n.t("profile_load_error"));
    }
});

i18n.applyTranslations();
i18n.initLanguageSwitcher();

document.addEventListener("languageChanged", () => {
    i18n.applyTranslations();
    renderProfileInfo();
    renderProfilePosts();
    renderFollowButton();
    renderMessageButton();
});

function isFollowingViewedUser() {
    return Array.isArray(currentUser.following) && currentUser.following.includes(viewedUserId);
}

async function toggleFollowUser() {
    const updatedViewedUser = await window.apiRequest(`/users/${viewedUserId}/follow`, {
        method: "PATCH",
        body: JSON.stringify({
            currentUserId: currentUser._id
        })
    });

    viewedUser = updatedViewedUser;
    viewedUserProfile = viewedUser.profile;

    const nowFollowing = viewedUser.followers.includes(currentUser._id);

    if (!Array.isArray(currentUser.following)) {
        currentUser.following = [];
    }

    if (nowFollowing) {
        if (!currentUser.following.includes(viewedUserId)) {
            currentUser.following.push(viewedUserId);
        }
    } else {
        currentUser.following = currentUser.following.filter(id => id !== viewedUserId);
    }

    localStorage.setItem("artspaceCurrentUser", JSON.stringify(currentUser));

    renderProfileInfo();
    renderFollowButton();
}
function renderFollowButton() {
    if (!followBtn) return;

    if (isOwnProfile) {
        followBtn.style.display = "none";
        return;
    }

    followBtn.style.display = "inline-flex";

    const isFollowing = isFollowingViewedUser();

    followBtn.textContent = isFollowing ? i18n.t("unfollow") : i18n.t("follow");

    followBtn.classList.toggle("following", isFollowing);
}

if (followBtn) {
    followBtn.addEventListener("click", async function () {
        try {
            await toggleFollowUser();
        } catch (error) {
            alert(error.message || "Не вдалося виконати підписку");
        }
    });
}
if (messageBtn) {
    messageBtn.addEventListener("click", () => {
        if (!viewedUserId || isOwnProfile) return;
        window.location.href = `chats.html?userId=${viewedUserId}`;
    });
}

function renderMessageButton() {
    if (!messageBtn) return;

    if (isOwnProfile) {
        messageBtn.style.display = "none";
        return;
    }

    messageBtn.style.display = "inline-flex";
}