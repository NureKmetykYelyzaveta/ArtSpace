const i18n = window.ArtSpaceI18n;
const currentUser = window.ArtSpaceAuth.requireAuth();
const userProfile = currentUser.profile;

const DEFAULT_AVATAR =
    (window.ArtSpaceAuth && window.ArtSpaceAuth.DEFAULT_AVATAR) ||
    "https://grizly.club/uploads/posts/2023-08/1691270675_grizly-club-p-kartinki-avatarki-bez-fona-55.jpg";

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

function renderHeaderProfile() {
    document.querySelectorAll(".header-avatar").forEach(img => {
        img.src = userProfile.avatar || DEFAULT_AVATAR;
    });
}

function getQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
}

async function searchUsers(query) {
    if (!query.trim()) {
        searchResults.innerHTML = `<div class="profile-empty"><p>${i18n.t("search_enter_author")}</p></div>`;
        return;
    }

    try {
        const users = await window.apiRequest(`/users/search/${encodeURIComponent(query)}`);

        if (!users.length) {
            searchResults.innerHTML = `<div class="profile-empty"><p>${i18n.t("search_empty")}</p></div>`;
            return;
        }

        searchResults.innerHTML = users.map(user => `
            <a class="author-result-card" href="profile.html?userId=${user._id}">
                <img
                    class="author-result-avatar"
                    src="${user.profile?.avatar || DEFAULT_AVATAR}"
                    alt="${user.profile?.nick || user.name}"
                >
                <div class="author-result-info">
                    <div class="author-result-name">${user.name}</div>
                    <div class="author-result-nick">${user.profile?.nick || ""}</div>
                    <div class="author-result-bio">${user.profile?.bio || i18n.t("profile_default_bio")}</div>
                </div>
            </a>
        `).join("");
    } catch (error) {
        searchResults.innerHTML = `<div class="profile-empty"><p>${error.message || i18n.t("search_error")}</p></div>`;
    }
}

searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        const value = searchInput.value.trim();
        window.location.href = `search.html?q=${encodeURIComponent(value)}`;
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    renderHeaderProfile();

    const query = getQueryFromUrl();
    searchInput.value = query;

    await searchUsers(query);
});



let text = i18n.t("search_placeholder");
let index = 0;
let isDeleting = false;

function loopPlaceholder() {
    const currentText = text.substring(0, index);
    searchInput.setAttribute("placeholder", currentText);

    if (!isDeleting && index < text.length) {
        index++;
        setTimeout(loopPlaceholder, 60);
    } else if (!isDeleting) {
        isDeleting = true;
        setTimeout(loopPlaceholder, 1200);
    } else if (isDeleting && index > 0) {
        index--;
        setTimeout(loopPlaceholder, 30);
    } else {
        isDeleting = false;
        setTimeout(loopPlaceholder, 400);
    }
}

loopPlaceholder();

i18n.applyTranslations();
i18n.initLanguageSwitcher();

document.addEventListener("languageChanged", async () => {
    i18n.applyTranslations();
    text = i18n.t("search_placeholder");
    index = 0;
    isDeleting = false;
    loopPlaceholder();

    const query = getQueryFromUrl();
    await searchUsers(query);
});