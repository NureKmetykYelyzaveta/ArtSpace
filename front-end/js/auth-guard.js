(function () {
    const user = window.ArtSpaceAuth ? window.ArtSpaceAuth.getCurrentUser() : null;
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.endsWith("/auth.html") || path.endsWith("auth.html");

    if (!user && !isAuthPage) {
        window.location.replace("auth.html");
        return;
    }

    if (user && isAuthPage) {
        window.location.replace("index.html");
    }
})();