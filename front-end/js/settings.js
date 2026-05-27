const i18n = window.ArtSpaceI18n;
const user = window.ArtSpaceAuth.requireAuth();

const nameEl = document.getElementById("settingsName");
const nickEl = document.getElementById("settingsNick");
const bioEl = document.getElementById("settingsBio");
const logoutBtn = document.getElementById("logoutBtn");

const DEFAULT_AVATAR =
    (window.ArtSpaceAuth && window.ArtSpaceAuth.DEFAULT_AVATAR) ||
    "https://grizly.club/uploads/posts/2023-08/1691270675_grizly-club-p-kartinki-avatarki-bez-fona-55.jpg";

    i18n.applyTranslations();
i18n.initLanguageSwitcher();

if (user) {
    nameEl.textContent = user.name || "—";
    nickEl.textContent = user.profile?.nick || "—";
    bioEl.textContent = user.profile?.bio || "—";

    document.querySelectorAll(".header-avatar").forEach(img => {
        img.src = user.profile?.avatar || DEFAULT_AVATAR;
    });
}

logoutBtn.addEventListener("click", async () => {
    const confirmLogout = confirm(i18n.t("logout_confirm"));
    if (!confirmLogout) return;

    await window.ArtSpaceAuth.logout();
});

document.addEventListener("languageChanged", () => {
    i18n.applyTranslations();
});