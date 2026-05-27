const currentUser =
    window.ArtSpaceAuth.requireAuth();

const i18n =
    window.ArtSpaceI18n;

if (!currentUser.isAdmin) {
    window.location.href = "index.html";
}

const reportsContainer =
    document.getElementById("reportsContainer");

const reportsSection =
    document.getElementById("reportsSection");

const challengesSection =
    document.getElementById("challengesSection");

const challengeForm =
    document.getElementById("challengeForm");

const challengeTitleInput =
    document.getElementById("challengeTitleInput");

const challengeDescriptionInput =
    document.getElementById("challengeDescriptionInput");

const activeChallengePreview =
    document.getElementById("activeChallengePreview");

let activeAdminChallenge = null;

function setupAdminTabs() {

    document
        .querySelectorAll(".admin-tab")
        .forEach(tab => {

            tab.addEventListener("click", () => {

                const tabName =
                    tab.dataset.tab;

                document
                    .querySelectorAll(".admin-tab")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                document
                    .querySelectorAll(".admin-section")
                    .forEach(section =>
                        section.classList.remove("active")
                    );

                tab.classList.add("active");

                if (tabName === "reports") {

                    reportsSection.classList.add("active");

                    loadReports();
                }

                if (tabName === "challenges") {

                    challengesSection.classList.add("active");

                    loadActiveChallengeForAdmin();
                }
            });
        });
}

async function loadReports() {

    const reports =
        await window.apiRequest("/reports");

    if (!reports.length) {

        reportsContainer.innerHTML = `
            <div class="admin-empty">
                ${i18n.t("no_reports")}
            </div>
        `;

        return;
    }

    reportsContainer.innerHTML =
        reports.map(report => {

            const post =
                report.post || {};

            const reporter =
                report.reportedBy || {};

            return `
                <div class="report-card">

                    <div class="report-preview">
                        <img
                            src="${post.image || ''}"
                            class="report-image"
                            alt="Post preview"
                        >
                    </div>

                    <div class="report-content">

                        <div class="report-top">

                            <div>

                                <h2 class="report-title">
                                    ${post.title || "Unknown post"}
                                </h2>

                                <div class="report-author">
                                    ${i18n.t("author")}:
                                    ${post.authorNick || "Unknown"}
                                </div>

                            </div>

                            <div class="report-status ${report.status || "pending"}">
                                ${i18n.t(report.status || "pending")}
                            </div>

                        </div>

                        <div class="report-info">

                            <div class="report-info-item">
                                <span>
                                    ${i18n.t("report_from")}:
                                </span>

                                ${reporter.nick || "Unknown"}
                            </div>

                            <div class="report-info-item">

                                <span>
                                    ${i18n.t("reason")}:
                                </span>

                                ${report.reason}

                            </div>

                        </div>

                        <div class="report-actions">

                            <button
                                class="approve-btn"
                                onclick="approveReport('${report._id}')"
                            >
                                ${i18n.t("approve")}
                            </button>

                            <button
                                class="reject-btn"
                                onclick="rejectReport('${report._id}')"
                            >
                                ${i18n.t("reject")}
                            </button>

                        </div>

                    </div>

                </div>
            `;

        }).join("");
}

async function approveReport(id) {

    await window.apiRequest(
        `/reports/${id}/approve`,
        {
            method: "PATCH"
        }
    );

    loadReports();
}

async function rejectReport(id) {

    await window.apiRequest(
        `/reports/${id}/reject`,
        {
            method: "PATCH"
        }
    );

    loadReports();
}

async function loadActiveChallengeForAdmin() {

    try {

        const challenge =
            await window.apiRequest(
                "/challenges/active"
            );

        activeAdminChallenge =
            challenge;

        challengeTitleInput.value =
            challenge.title || "";

        challengeDescriptionInput.value =
            challenge.description || "";

        renderActiveChallengePreview(
            challenge
        );

    } catch (error) {

        activeAdminChallenge =
            null;

        challengeTitleInput.value =
            "";

        challengeDescriptionInput.value =
            "";

        activeChallengePreview.innerHTML = `
            <div class="admin-empty">
                ${i18n.t("no_active_challenges")}
            </div>
        `;
    }
}

function renderActiveChallengePreview(challenge) {

    activeChallengePreview.innerHTML = `
        <div class="challenge-preview-title">
            ${challenge.title || "Challenge"}
        </div>

        <div class="challenge-preview-description">
            ${challenge.description || ""}
        </div>

        <div class="challenge-preview-stats">

            <div>
                <strong>
                    ${challenge.participantsCount || 0}
                </strong>

                <span>
                    ${i18n.t("challenge_participants")}
                </span>
            </div>

            <div>
                <strong>
                    ${challenge.worksCount || 0}
                </strong>

                <span>
                    ${i18n.t("challenge_works_today")}
                </span>
            </div>

        </div>
    `;
}

if (challengeForm) {

    challengeForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const title =
            challengeTitleInput.value.trim();

        const description =
            challengeDescriptionInput.value.trim();

        if (!title || !description) {

            alert(
                i18n.t("challenge_form_required")
            );

            return;
        }

        await window.apiRequest(
            "/challenges/admin/activate",
            {
                method: "POST",

                body: JSON.stringify({
                    title,
                    description
                })
            }
        );

        alert(
            i18n.t("challenge_saved")
        );

        await loadActiveChallengeForAdmin();
    });
}

async function finishActiveChallenge() {

    if (!activeAdminChallenge) {
        return;
    }

    const confirmed =
        confirm(
            i18n.t("finish_challenge_confirm")
        );

    if (!confirmed) {
        return;
    }

    await window.apiRequest(
        `/challenges/admin/${activeAdminChallenge._id}/finish`,
        {
            method: "PATCH"
        }
    );

    alert(
        i18n.t("challenge_finished")
    );

    await loadActiveChallengeForAdmin();
}

window.approveReport =
    approveReport;

window.rejectReport =
    rejectReport;

window.finishActiveChallenge =
    finishActiveChallenge;

setupAdminTabs();

i18n.applyTranslations();
i18n.initCustomLanguageDropdown();

loadReports();

document.addEventListener("languageChanged", () => {

    i18n.applyTranslations();

    if (reportsSection.classList.contains("active")) {
        loadReports();
    }

    if (challengesSection.classList.contains("active")) {
        loadActiveChallengeForAdmin();
    }
});