const API_BASE_URL = "http://127.0.0.1:8000/api";

async function apiRequest(path, options = {}) {

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },

            ...options
        }
    );

    let data = null;

    try {

        data = await response.json();

    } catch {

        data = null;
    }

    if (!response.ok) {

        throw new Error(
            data?.detail ||
            data?.message ||
            "Помилка запиту до сервера"
        );
    }

    return data;
}

async function getActiveChallenge() {

    return apiRequest(
        "/challenges/active"
    );
}

async function joinChallenge(challengeId, userId) {

    if (!challengeId) {
        throw new Error("Не знайдено ID челенджу");
    }

    if (!userId) {
        throw new Error("Не знайдено ID користувача");
    }

    return apiRequest(
        `/challenges/${challengeId}/join`,
        {
            method: "POST",

            body: JSON.stringify({
                userId
            })
        }
    );
}

async function getChallengePosts(challengeId) {

    if (!challengeId) {
        throw new Error("Не знайдено ID челенджу");
    }

    return apiRequest(
        `/posts/challenge/${challengeId}`
    );
}

window.API_BASE_URL = API_BASE_URL;
window.apiRequest = apiRequest;

window.getActiveChallenge = getActiveChallenge;
window.joinChallenge = joinChallenge;
window.getChallengePosts = getChallengePosts;