const i18n = window.ArtSpaceI18n;

const authCard = document.getElementById("authCard");
const authForm = document.getElementById("authForm");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const switchText = document.getElementById("switchText");
const switchModeBtn = document.getElementById("switchModeBtn");
const authMessage = document.getElementById("authMessage");

const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const submitBtn = document.getElementById("submitBtn");

let isLoginMode = true;

if (window.ArtSpaceAuth.getCurrentUser()) {
    window.location.replace("index.html");
}

function applyAuthModeTexts() {
    if (isLoginMode) {
        formTitle.textContent = i18n.t("auth_login_title");
        formSubtitle.textContent = i18n.t("auth_login_subtitle");
        switchText.textContent = i18n.t("auth_switch_to_register_text");
        switchModeBtn.textContent = i18n.t("auth_switch_to_register_btn");
        submitBtn.textContent = i18n.t("auth_login_btn");
    } else {
        formTitle.textContent = i18n.t("auth_register_title");
        formSubtitle.textContent = i18n.t("auth_register_subtitle");
        switchText.textContent = i18n.t("auth_switch_to_login_text");
        switchModeBtn.textContent = i18n.t("auth_switch_to_login_btn");
        submitBtn.textContent = i18n.t("auth_register_btn");
    }
}

function setMode(loginMode) {
    isLoginMode = loginMode;
    authCard.classList.toggle("register-mode", !loginMode);
    applyAuthModeTexts();
    authMessage.textContent = "";
}

switchModeBtn.addEventListener("click", () => {
    setMode(!isLoginMode);
});

authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        if (isLoginMode) {
            await window.ArtSpaceAuth.login({ email, password });
            window.location.replace("index.html");
            return;
        }

        const name = nameInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!name) {
            authMessage.textContent = i18n.t("auth_enter_name");
            return;
        }

        if (password.length < 6) {
            authMessage.textContent = i18n.t("auth_password_short");
            return;
        }

        if (password !== confirmPassword) {
            authMessage.textContent = i18n.t("auth_password_mismatch");
            return;
        }

        await window.ArtSpaceAuth.register({ name, email, password });
        window.location.replace("index.html");
    } catch (error) {
        authMessage.textContent = error.message || i18n.t("auth_error");
    }
});

i18n.applyTranslations();
i18n.initCustomLanguageDropdown();
setMode(true);

document.addEventListener("languageChanged", () => {
    i18n.applyTranslations();
    applyAuthModeTexts();
});