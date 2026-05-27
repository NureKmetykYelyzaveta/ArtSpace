const currentUser =
    window.ArtSpaceAuth.requireAuth();

const currentUserProfile =
    currentUser.profile || {};

const DEFAULT_AVATAR =
    (
        window.ArtSpaceAuth &&
        window.ArtSpaceAuth.DEFAULT_AVATAR
    )
    ||
    "https://grizly.club/uploads/posts/2023-08/1691270675_grizly-club-p-kartinki-avatarki-bez-fona-55.jpg";

const challengeHero =
    document.getElementById("challengeHero");

const challengeGrid =
    document.getElementById("challengeGrid");

const leaderboardList =
    document.getElementById("leaderboardList");

const i18n =
    window.ArtSpaceI18n;

const challengeImageModal =
    document.getElementById("challengeImageModal");

const closeChallengeImageModalBtn =
    document.getElementById("closeChallengeImageModal");

const challengeImageModalContent =
    document.getElementById("challengeImageModalContent");

let currentChallengeId = null;
let challengeTimerInterval = null;
let selectedChallengeImage = "";

function formatNick(nick) {

    if (!nick) {
        return "@user";
    }

    const cleanNick =
        String(nick).trim().replace(/^@+/, "");

    return `@${cleanNick}`;
}
function getEndOfToday() {

    const end =
        new Date();

    end.setHours(23, 59, 59, 999);

    return end;
}

function formatTimeLeft(milliseconds) {

    if (milliseconds <= 0) {
        return "00:00:00";
    }

    const totalSeconds =
        Math.floor(milliseconds / 1000);

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor((totalSeconds % 3600) / 60);

    const seconds =
        totalSeconds % 60;

    return [
        hours,
        minutes,
        seconds
    ]
        .map(value => String(value).padStart(2, "0"))
        .join(":");
}

function startChallengeTimer(challenge) {

    const timerValue =
        document.getElementById("challengeTimerValue");

    const joinButton =
        document.getElementById("challengeJoinButton");

    const expiredText =
        document.getElementById("challengeExpiredText");

    if (!timerValue) {
        return;
    }

    if (challengeTimerInterval) {
        clearInterval(challengeTimerInterval);
    }

    let endDate = null;

    if (challenge && challenge.endsAt) {
        endDate = new Date(challenge.endsAt);
    } else {
        endDate = getEndOfToday();
    }

    function updateTimer() {

        const now =
            new Date();

        const timeLeft =
            endDate.getTime() - now.getTime();

        timerValue.textContent =
            formatTimeLeft(timeLeft);

        if (timeLeft <= 0) {

            timerValue.textContent =
                "00:00:00";

            if (joinButton) {
                joinButton.style.display = "none";
            }

            if (expiredText) {
                expiredText.classList.remove("hidden");
            }

            clearInterval(challengeTimerInterval);
        }
    }

    updateTimer();

    challengeTimerInterval =
        setInterval(updateTimer, 1000);
}

function initChallengeImageUpload() {

    const fileInput =
        document.getElementById("challengePostImageFile");

    const previewBox =
        document.getElementById("challengeImagePreviewBox");

    const previewImage =
        document.getElementById("challengeImagePreview");

    if (!fileInput || !previewBox || !previewImage) {
        return;
    }

    fileInput.addEventListener("change", function () {

        const file =
            fileInput.files[0];

        if (!file) {

            selectedChallengeImage = "";

            previewBox.classList.add("hidden");

            previewImage.src = "";

            return;
        }

        if (!file.type.startsWith("image/")) {

            alert(i18n.t("challenge_only_images"));

            fileInput.value = "";

            selectedChallengeImage = "";

            previewBox.classList.add("hidden");

            previewImage.src = "";

            return;
        }

        const reader =
            new FileReader();

        reader.onload = function (event) {

            selectedChallengeImage =
                event.target.result;

            previewImage.src =
                selectedChallengeImage;

            previewBox.classList.remove("hidden");
        };

        reader.readAsDataURL(file);
    });
}

function getCurrentUserId() {

    return (
        currentUser._id ||
        currentUser.id ||
        currentUser.userId
    );
}

function getCurrentUserNick() {

    return (
        currentUserProfile.nick ||
        currentUser.nick ||
        currentUser.username ||
        currentUser.name ||
        "user"
    );
}

function renderHeaderAvatar() {

    document
        .querySelectorAll(".header-avatar")
        .forEach(img => {

            img.src =
                currentUserProfile.avatar ||
                currentUser.avatar ||
                DEFAULT_AVATAR;
        });
}

function openChallengeImageModal(src, alt) {

    if (!challengeImageModal || !challengeImageModalContent) {
        return;
    }

    challengeImageModalContent.src =
        src;

    challengeImageModalContent.alt =
        alt || "Challenge post image";

    challengeImageModal.classList.add("open");

    document.body.classList.add("modal-open");

    if (window.lucide) {
        lucide.createIcons();
    }
}

function closeChallengeImageModal() {

    if (!challengeImageModal || !challengeImageModalContent) {
        return;
    }

    challengeImageModal.classList.remove("open");

    challengeImageModalContent.src =
        "";

    challengeImageModalContent.alt =
        "";

    const uploadModal =
        document.getElementById("challengeUploadModal");

    const isUploadModalOpen =
        uploadModal &&
        !uploadModal.classList.contains("hidden");

    if (!isUploadModalOpen) {
        document.body.classList.remove("modal-open");
    }
}

function getChallengeId() {

    const params =
        new URLSearchParams(window.location.search);

    return params.get("id");
}

async function loadChallengePage() {

    try {

        const challenge =
            await window.getActiveChallenge();

        if (!challenge || !challenge._id) {

            challengeHero.innerHTML = `
                <div class="challenge-empty">
                    ${i18n.t("no_active_challenges")}
                </div>
            `;

            challengeGrid.innerHTML = "";
            leaderboardList.innerHTML = "";

            return;
        }

        const challengeId =
            challenge._id;

        currentChallengeId =
            challengeId;

        const posts =
            await window.getChallengePosts(
                challengeId
            );

        renderChallengeHero(
            challenge,
            challengeId
        );

        renderChallengePosts(
            posts
        );

        renderLeaderboard(
            posts
        );

    } catch (error) {

        console.error(error);

        challengeHero.innerHTML = `
            <div class="challenge-empty">
                ${i18n.t("no_active_challenges")}
            </div>
        `;

        challengeGrid.innerHTML = "";
        leaderboardList.innerHTML = "";
    }
}

function renderChallengeHero(challenge, challengeId) {

    challengeHero.innerHTML = `

        <div class="challenge-overlay"></div>

        <div class="challenge-hero-content">

            <div class="challenge-badge">

                <i data-lucide="flame"></i>

                <span>
                    ${i18n.t("active_challenge")}
                </span>

            </div>

            <div class="challenge-title">
                ${challenge.title || "Challenge"}
            </div>

            <div class="challenge-description">
                ${challenge.description || ""}
            </div>

            <div class="challenge-timer-card">

                <div class="challenge-timer-label">

                    <i data-lucide="clock"></i>

                    <span>
                        ${i18n.t("challenge_time_left")}
                    </span>

                </div>

                <div
                    class="challenge-timer-value"
                    id="challengeTimerValue">

                    00:00:00

                </div>

            </div>

            <div class="challenge-meta">

                <div class="challenge-meta-item">

                    <span class="challenge-meta-value">
                        ${challenge.participantsCount || 0}
                    </span>

                    <span class="challenge-meta-label">
                        ${i18n.t("challenge_participants")}
                    </span>

                </div>

                <div class="challenge-meta-item">

                    <span class="challenge-meta-value">
                        ${challenge.worksCount || 0}
                    </span>

                    <span class="challenge-meta-label">
                        ${i18n.t("challenge_works_today")}
                    </span>

                </div>

            </div>

            <div class="challenge-actions">

                <button
                    class="challenge-upload-btn"
                    id="challengeJoinButton"
                    onclick="joinChallengeChallengePage('${challengeId}')"
                >

                    <i data-lucide="sparkles"></i>

                    <span>
                        ${i18n.t("join_challenge")}
                    </span>

                </button>

                <div
                    class="challenge-expired-text hidden"
                    id="challengeExpiredText">

                    ${i18n.t("challenge_expired")}

                </div>

            </div>

        </div>

    `;

    startChallengeTimer(challenge);

    requestAnimationFrame(() => {

        if (window.lucide) {
            lucide.createIcons();
        }
    });
}

function renderChallengePosts(posts) {

    if (!Array.isArray(posts) || !posts.length) {

        challengeGrid.innerHTML = `

            <div class="challenge-empty">

                ${i18n.t("challenge_empty")}

            </div>

        `;

        return;
    }

    challengeGrid.innerHTML =
        posts.map(post => `

            <article class="challenge-post-card">

                <img
                    src="${post.image}"
                    class="challenge-post-image open-challenge-image"
                    alt="${post.title || "Challenge post"}"
                    data-image="${post.image}"
                    data-title="${post.title || "Challenge post"}"
                >

                <div class="challenge-post-content">

                    <div class="challenge-post-top">

                        <div>

                            <div class="challenge-post-title">
                                ${post.title || "Без назви"}
                            </div>

                            <div class="challenge-post-author">
                                ${formatNick(post.authorNick || "user")}
                            </div>

                        </div>

                        <div class="challenge-entry-badge">

                            <i data-lucide="sparkles"></i>

                            <span>
                                ${i18n.t("challenge_entry")}
                            </span>

                        </div>

                    </div>

                    <div class="challenge-post-bottom">

                        <button
                            class="challenge-like-btn ${isChallengePostLiked(post) ? "active" : ""}"
                            type="button"
                            onclick="toggleChallengePostLike('${post._id}')"
                        >

                            <i data-lucide="heart"></i>

                            <span>
                                ${post.likes || 0}
                            </span>

                        </button>

                    </div>

                </div>

            </article>

        `).join("");

    requestAnimationFrame(() => {

        if (window.lucide) {
            lucide.createIcons();
        }
    });
}
document.addEventListener("click", function (e) {

    const image =
        e.target.closest(".open-challenge-image");

    if (!image) {
        return;
    }

    openChallengeImageModal(
        image.dataset.image,
        image.dataset.title
    );
});

if (closeChallengeImageModalBtn) {

    closeChallengeImageModalBtn.addEventListener(
        "click",
        closeChallengeImageModal
    );
}

if (challengeImageModal) {

    challengeImageModal.addEventListener(
        "click",
        function (e) {

            if (e.target === challengeImageModal) {
                closeChallengeImageModal();
            }
        }
    );
}

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {

        if (
            challengeImageModal &&
            challengeImageModal.classList.contains("open")
        ) {
            closeChallengeImageModal();
            return;
        }
    }
});

function getCurrentUserId() {

    return (
        currentUser._id ||
        currentUser.id ||
        currentUser.userId
    );
}

function isChallengePostLiked(post) {

    const userId =
        getCurrentUserId();

    if (!userId || !Array.isArray(post.likedBy)) {
        return false;
    }

    return post.likedBy
        .map(id => String(id))
        .includes(String(userId));
}

async function toggleChallengePostLike(postId) {

    const userId =
        getCurrentUserId();

    if (!userId) {
        alert("Помилка: не знайдено ID користувача");
        return;
    }

    try {

        await window.apiRequest(
            `/posts/${postId}/like`,
            {
                method: "PATCH",

                body: JSON.stringify({
                    userId: userId
                })
            }
        );

        await loadChallengePage();

    } catch (error) {

        console.error(error);
        alert(error.message || "Не вдалося поставити лайк");
    }
}

function renderLeaderboard(posts) {

    const sorted =
        Array.isArray(posts)
            ? [...posts]
                .sort((a, b) =>
                    (b.likes || 0) -
                    (a.likes || 0)
                )
                .slice(0, 10)
            : [];

    if (!sorted.length) {

        leaderboardList.innerHTML = `

            <div class="leaderboard-empty">

                ${i18n.t("empty_leaderboard")}

            </div>

        `;

        return;
    }

    leaderboardList.innerHTML =
        sorted.map((post, index) => `

            <div class="leaderboard-item">

                <div class="leaderboard-left">

                    <div class="leaderboard-rank">

                        #${index + 1}

                    </div>

                    <div class="leaderboard-user">

                        ${formatNick(post.authorNick)} 

                    </div>

                </div>

                <div class="leaderboard-score">

                    <i data-lucide="heart"></i>
                    ${post.likes || 0}

                </div>

            </div>

        `).join("");

    requestAnimationFrame(() => {

        if (window.lucide) {
            lucide.createIcons();
        }
    });
}

async function joinChallengeChallengePage(
    challengeId
) {

    if (!challengeId) {

        alert("Помилка: не знайдено ID челенджу");
        return;
    }

    openUploadModal(challengeId);

    const userId =
        currentUser._id ||
        currentUser.id ||
        currentUser.userId;

    if (!userId) {

        console.warn(
            "ID користувача не знайдено, але модальне вікно вже відкрито",
            currentUser
        );

        return;
    }

    try {

        await window.joinChallenge(
            challengeId,
            userId
        );

        console.log(
            "Користувач приєднався до челенджу"
        );

    } catch (error) {

        console.warn(
            "Запит join повернув помилку, але це не блокує публікацію:",
            error.message
        );
    }
}

function openUploadModal(challengeId) {

    currentChallengeId =
        challengeId;

    const modal =
        document.getElementById(
            "challengeUploadModal"
        );

    if (!modal) {

        console.error(
            "Модальне вікно challengeUploadModal не знайдено"
        );

        alert("Помилка: модальне вікно не знайдено");
        return;
    }

    modal.classList.remove("hidden");

    console.log(
        "Модальне вікно відкрито для challengeId:",
        challengeId
    );
}

function closeChallengeUploadModal() {

    const modal =
        document.getElementById(
            "challengeUploadModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
}

async function submitChallengePost() {

    const timerValue =
    document.getElementById("challengeTimerValue");

if (timerValue && timerValue.textContent.trim() === "00:00:00") {

    alert(i18n.t("challenge_expired"));
    return;
}

    const title =
        document
            .getElementById(
                "challengePostTitle"
            )
            .value
            .trim();

    const image =
        selectedChallengeImage;

    if (!title || !image) {

        alert(i18n.t("challenge_fill_all_fields"));

        return;
    }

    const userId =
        currentUser._id ||
        currentUser.id ||
        currentUser.userId;

    if (!userId) {

        alert(i18n.t("challenge_user_id_error"));

        return;
    }

    if (!currentChallengeId) {

        alert(i18n.t("challenge_id_error"));

        return;
    }

    try {

        await window.apiRequest(
            "/posts",
            {
                method: "POST",

                body: JSON.stringify({

                    title,

                    image,

                    authorId:
                        userId,

                    authorNick:
                        currentUserProfile.nick ||
                        currentUser.nick ||
                        currentUser.username ||
                        currentUser.name ||
                        "user",

                    likes: 0,

                    likedBy: [],

                    category:
                        "Challenge",

                    tags: ["challenge"],

                    challengeId:
                        currentChallengeId,

                    createdAt:
                        new Date().toISOString()
                })
            }
        );

        document
            .getElementById(
                "challengePostTitle"
            )
            .value = "";

        const fileInput =
            document.getElementById(
                "challengePostImageFile"
            );

        if (fileInput) {
            fileInput.value = "";
        }

        selectedChallengeImage = "";

        const previewBox =
            document.getElementById(
                "challengeImagePreviewBox"
            );

        const previewImage =
            document.getElementById(
                "challengeImagePreview"
            );

        if (previewBox) {
            previewBox.classList.add("hidden");
        }

        if (previewImage) {
            previewImage.src = "";
        }

        closeChallengeUploadModal();

        loadChallengePage();

    } catch (error) {

        alert(error.message);
    }
}
setInterval(() => {

    const modal =
        document.getElementById("challengeUploadModal");

    const isModalOpen =
        modal && !modal.classList.contains("hidden");

    if (!isModalOpen) {
        loadChallengePage();
    }

}, 15000);



window.joinChallengeChallengePage =
    joinChallengeChallengePage;

window.openUploadModal =
    openUploadModal;

window.closeChallengeUploadModal =
    closeChallengeUploadModal;

window.submitChallengePost =
    submitChallengePost;

window.toggleChallengePostLike =
    toggleChallengePostLike;

i18n.applyTranslations();

renderHeaderAvatar();

initChallengeImageUpload();

loadChallengePage();

requestAnimationFrame(() => {

    lucide.createIcons();

});