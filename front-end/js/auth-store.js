const ArtSpaceAuth = (() => {
    const CURRENT_USER_KEY = "artspaceCurrentUser";
    const DEFAULT_AVATAR =
        "https://grizly.club/uploads/posts/2023-08/1691270675_grizly-club-p-kartinki-avatarki-bez-fona-55.jpg";

    function getStoredUser() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setStoredUser(user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }

    function clearStoredUser() {
        localStorage.removeItem(CURRENT_USER_KEY);
    }

    function normalizeUser(user) {
        if (!user) return null;

        return {
            ...user,
            isAdmin: user.isAdmin === true,
            followers: Array.isArray(user.followers) ? user.followers : [],
            following: Array.isArray(user.following) ? user.following : [],
            profile: {
                nick: user.profile?.nick || "",
                bio: user.profile?.bio || "",
                avatar: user.profile?.avatar || DEFAULT_AVATAR
            }
        };
    }

    async function register({ name, email, password }) {
        const nickBase = name.trim().replace(/\s+/g, "_");
        const payload = {
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            profile: {
                nick: `@${nickBase}`,
                bio: "",
                avatar: DEFAULT_AVATAR
            }
        };

        const user = await window.apiRequest("/users/register", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const normalized = normalizeUser(user);
        setStoredUser(normalized);
        return { ok: true, user: normalized };
    }

    async function login({ email, password }) {
        const user = await window.apiRequest("/users/login", {
            method: "POST",
            body: JSON.stringify({
                email: email.trim(),
                password: password.trim()
            })
        });

        const normalized = normalizeUser(user);
        setStoredUser(normalized);
        return { ok: true, user: normalized };
    }

    async function updateCurrentUserProfile(updates) {
        const currentUser = getStoredUser();
        if (!currentUser) return null;

        const user = await window.apiRequest(`/users/${currentUser._id}`, {
            method: "PUT",
            body: JSON.stringify({
                name: updates.name,
                nick: updates.nick,
                bio: updates.bio,
                avatar: updates.avatar
            })
        });

        const normalized = normalizeUser(user);
        setStoredUser(normalized);

        return {
            user: normalized,
            oldNick: currentUser.profile.nick,
            newNick: normalized.profile.nick
        };
    }

    function getCurrentUser() {
        return getStoredUser();
    }

    async function logout() {
        const user = getStoredUser();

        if (window.stopHeartbeat) {
            window.stopHeartbeat();
        }

        clearStoredUser();

        if (user?._id) {
            try {
                await window.apiRequest(`/users/${user._id}/offline`, {
                    method: "PATCH"
                });
            } catch (error) {
                console.error("Не вдалося оновити статус offline:", error);
            }
        }

        window.location.replace("auth.html");
    }

    function requireAuth() {
        const user = getStoredUser();
        if (!user) {
            window.location.replace("auth.html");
            return null;
        }
        return user;
    }

    return {
        DEFAULT_AVATAR,
        register,
        login,
        logout,
        getCurrentUser,
        requireAuth,
        updateCurrentUserProfile
    };
})();

window.ArtSpaceAuth = ArtSpaceAuth;