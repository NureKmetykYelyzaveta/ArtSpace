const I18N_STORAGE_KEY = "artspaceLanguage";

const translations = {
    uk: {
        logo: "ArtSpace",
        lang_uk: "UKR",
        lang_en: "ENG",

        auth_hero_title: "Поринь у світ цифрового мистецтва",
        auth_hero_subtitle: "Публікуй ілюстрації, збирай фідбек, знаходь однодумців і створюй власний творчий простір.",

        auth_login_title: "Вхід",
        auth_login_subtitle: "Увійди, щоб продовжити роботу в ArtSpace",
        auth_register_title: "Реєстрація",
        auth_register_subtitle: "Створи акаунт і почни публікувати свої роботи",

        auth_name_label: "Ім’я",
        auth_email_label: "Email",
        auth_password_label: "Пароль",
        auth_confirm_password_label: "Підтвердження пароля",

        auth_name_placeholder: "Введи ім’я",
        auth_email_placeholder: "Введи email",
        auth_password_placeholder: "Введи пароль",
        auth_confirm_password_placeholder: "Повтори пароль",

        auth_login_btn: "Увійти",
        auth_register_btn: "Створити акаунт",

        auth_switch_to_register_text: "Ще не маєш акаунта?",
        auth_switch_to_register_btn: "Зареєструватися",
        auth_switch_to_login_text: "Вже маєш акаунт?",
        auth_switch_to_login_btn: "Увійти",

        auth_enter_name: "Введи ім’я.",
        auth_password_short: "Пароль має містити щонайменше 6 символів.",
        auth_password_mismatch: "Паролі не співпадають.",
        auth_error: "Сталася помилка.",

        search_placeholder: "Пошук ілюстрацій, тегів, авторів...",
        copy_link: "Копіювати посилання",
        copied: "Посилання скопійовано",
        save: "Зберегти",
        saved: "Збережено",
        report: "Поскаржитись",
        report_sent: "Скаргу на пост відправлено",
        comments_empty: "Поки що коментарів немає. Будь першим.",
        empty_filtered_posts: "Нічого не знайдено за вибраними фільтрами або пошуком.",

        sidebar_categories: "Категорії",
        sidebar_popular_tags: "Популярні теги",

        category_all: "Всі",
        category_digital_art: "Digital Art",
        category_fantasy: "Fantasy",
        category_cyberpunk: "Cyberpunk",
        category_nature: "Nature",
        category_game_art: "Game Art",
        category_characters: "Characters",
        category_concept_art: "Concept Art",
        category_sci_fi: "Sci-Fi",
        category_sketches: "Sketches",
        category_illustrations: "Illustrations",
        category_comics: "Comics",

        popular_communities: "Популярні спільноти",
        community_members_1: "12 430 учасників",
        community_members_2: "8 920 учасників",
        community_members_3: "10 105 учасників",
        community_members_4: "6 740 учасників",
        join: "Join",

        challenge_of_day: "Challenge дня",
        challenge_theme: "Тема",
        challenge_participants: "учасників",
        challenge_works_today: "робіт сьогодні",
        join_challenge: "Приєднатись",

        comments_title: "Коментарі",
        comment_placeholder: "Напиши коментар...",

        new_post: "Нова публікація",
        image: "Зображення",
        choose_file: "Обрати файл",
        title: "Назва",
        category: "Категорія",
        choose_category: "Оберіть категорію",
        tags: "Теги",
        tags_placeholder: "Наприклад: fantasy, moon, portrait",
        cancel: "Скасувати",
        publish: "Опублікувати",
        send: "Надіслати",
        upload: "Upload",

        profile_home: "Головна",
        profile_chats: "Чати",
        profile_saved: "Збережені",
        profile_settings: "Налаштування",

        edit_profile: "Редагувати профіль",
        follow: "Підписатися",
        unfollow: "Відписатися",
        message: "Написати",

        profile_default_bio: "Без опису",
        profile_posts: "Публікації",
        profile_posts_count: "публікацій",
        profile_likes_count: "вподобань",
        profile_followers_count: "читачів",
        profile_no_posts: "У цього користувача ще немає публікацій.",
        back_home: "Головна",
        moderation_title: "Модерація скарг",
        report_from: "Скарга від",
        reason: "Причина",
        author: "Автор",
        approve: "Підтвердити",
        reject: "Відхилити",
        no_reports: "Скарг поки немає",
        pending: "На розгляді",
        approved: "Схвалено",
        rejected: "Відхилено",
        challenge_empty: "Поки що немає робіт",
        leaderboard: "Рейтинг",
        challenge_entry: "Учасник челенджу",
        active_challenge: "Активний челендж",
        empty_leaderboard: "Рейтинг порожній",

        edit_profile_title: "Редагувати профіль",
        choose_avatar: "Обрати аватар",
        remove_avatar: "Видалити аватар",
        name: "Ім’я",
        nick: "Нік",
        bio: "Біо",
        save_changes: "Зберегти",

        edit_post_title: "Редагувати публікацію",
        delete: "Видалити",
        edit: "Редагувати",

        delete_post_confirm: "Видалити пост",
        profile_load_error: "Не вдалося завантажити профіль",
        profile_update_error: "Не вдалося оновити профіль",
        post_update_error: "Не вдалося оновити пост",
        post_create_error: "Не вдалося створити пост",
        comment_add_error: "Не вдалося додати коментар",
        follow_error: "Не вдалося виконати підписку",
        challenge_of_day: "Challenge дня",
        challenge_theme: "Тема",
        challenge_participants: "учасників",
        challenge_works_today: "робіт",
        join_challenge: "Відкрити challenge",
        challenge_empty: "Поки що немає робіт",
        leaderboard: "Рейтинг",
        challenge_entry: "Учасник challenge",
        active_challenge: "Активний challenge",
        empty_leaderboard: "Рейтинг порожній",
        challenge_open: "Відкрити challenge",
        loading: "Завантаження...",
        challenge_joined: "Ти приєднався до challenge",
        challenge_no_active: "Немає активних challenge",
        challenge_upload_title: "Завантаження роботи до челенджу",
        challenge_post_title_placeholder: "Назва роботи",
        challenge_choose_image: "Обрати зображення з пристрою",
        challenge_publish_artwork: "Опублікувати роботу",
        challenge_fill_all_fields: "Заповніть назву роботи та оберіть зображення",
        challenge_only_images: "Можна завантажувати тільки зображення",
        challenge_user_id_error: "Помилка: не знайдено ID користувача",
        challenge_id_error: "Помилка: не знайдено ID челенджу",
        search_results: "Результати пошуку",
        search_enter_author: "Введи ім’я або нік автора.",
        search_empty: "Нічого не знайдено.",
        search_error: "Помилка пошуку",
        settings_title: "Налаштування",
        settings_profile_tab: "Профіль",
        settings_account_tab: "Акаунт",
        settings_security_tab: "Безпека",
        settings_profile_title: "Профіль",
        settings_account_title: "Акаунт",
        logout: "Вийти з акаунта",
        logout_confirm: "Вийти з акаунта?",

        saved_title: "Збережені публікації",
        saved_description: "Тут зберігаються всі пости, які ти відмітив(ла) як збережені.",
        saved_count_label: "збережених",
        saved_section_title: "Збережені",
        saved_empty: "У тебе ще немає збережених публікацій.",
        saved_create_error: "Не вдалося створити пост",
        saved_comment_error: "Не вдалося додати коментар",
        challenge_of_day: "Challenge дня",
        challenge_theme: "Тема",
        challenge_participants: "учасників",
        challenge_works_today: "робіт сьогодні",
        join_challenge: "Приєднатись",

        chats_title: "Чати",
        chat_select: "Оберіть чат",
        admin_panel_title: "Панель модератора",
        admin_reports_tab: "Скарги",
        admin_challenges_tab: "Челенджі",
        challenge_admin_title: "Керування челенджем",
        active_challenge_settings: "Налаштування активного челенджу",
        challenge_title_label: "Тема челенджу",
        challenge_description_label: "Опис челенджу",
        save_challenge: "Зберегти челендж",
        finish_challenge: "Завершити челендж",
        current_active_challenge: "Поточний активний челендж",
        challenge_form_required: "Заповніть тему та опис челенджу",
        challenge_saved: "Челендж збережено",
        finish_challenge_confirm: "Ви точно хочете завершити активний челендж?",
        challenge_finished: "Челендж завершено",
        no_active_challenges: "Активних челенджів немає",
        typing: "друкує...",
        online: "в мережі",
        offline: "не в мережі",
        no_chats: "У тебе ще немає чатів.",
        no_messages: "Поки що повідомлень немає.",
        no_last_message: "Немає повідомлень",
        challenge_time_left: "До завершення",
        challenge_expired: "Челендж завершено",
        message_placeholder: "Напиши повідомлення..."

    },

    en: {
        logo: "ArtSpace",
        lang_uk: "UKR",
        lang_en: "ENG",
        challenge_time_left: "Time left",
        challenge_expired: "Challenge expired",

        auth_hero_title: "Dive into the world of digital art",
        auth_hero_subtitle: "Publish illustrations, get feedback, find like-minded people, and build your own creative space.",

        auth_login_title: "Login",
        auth_login_subtitle: "Sign in to continue using ArtSpace",
        auth_register_title: "Register",
        auth_register_subtitle: "Create an account and start sharing your art",

        auth_name_label: "Name",
        challenge_empty: "No works yet",
        admin_panel_title: "Moderator panel",
        admin_reports_tab: "Reports",
        admin_challenges_tab: "Challenges",
        challenge_admin_title: "Challenge management",
        active_challenge_settings: "Active challenge settings",
        challenge_title_label: "Challenge theme",
        challenge_description_label: "Challenge description",
        save_challenge: "Save challenge",
        finish_challenge: "Finish challenge",
        current_active_challenge: "Current active challenge",
        challenge_form_required: "Fill in the challenge theme and description",
        challenge_saved: "Challenge saved",
        finish_challenge_confirm: "Are you sure you want to finish the active challenge?",
        challenge_finished: "Challenge finished",
        no_active_challenges: "There are no active challenges",
        leaderboard: "Leaderboard",
        challenge_entry: "Challenge Entry",
        active_challenge: "Active Challenge",
        empty_leaderboard: "Empty leaderboard",
        auth_email_label: "Email",
        auth_password_label: "Password",
        auth_confirm_password_label: "Confirm password",
        challenge_upload_title: "Upload challenge entry",
        challenge_post_title_placeholder: "Artwork title",
        challenge_choose_image: "Choose image from device",
        challenge_publish_artwork: "Publish artwork",
        challenge_fill_all_fields: "Fill in the artwork title and choose an image",
        challenge_only_images: "Only image files can be uploaded",
        challenge_user_id_error: "Error: user ID was not found",
        challenge_id_error: "Error: challenge ID was not found",

        auth_name_placeholder: "Enter your name",
        auth_email_placeholder: "Enter your email",
        auth_password_placeholder: "Enter your password",
        auth_confirm_password_placeholder: "Repeat your password",

        auth_login_btn: "Login",
        back_home: "Home",
        moderation_title: "Reports moderation",
        report_from: "Reported by",
        reason: "Reason",
        author: "Author",
        approve: "Approve",
        reject: "Reject",
        no_reports: "No reports yet",
        challenge_of_day: "Challenge of the day",
        challenge_theme: "Theme",
        challenge_participants: "participants",
        challenge_works_today: "works",
        join_challenge: "Open challenge",
        challenge_empty: "No works yet",
        leaderboard: "Leaderboard",
        challenge_entry: "Challenge Entry",
        active_challenge: "Active Challenge",
        empty_leaderboard: "Empty leaderboard",
        challenge_open: "Open challenge",
        challenge_joined: "You joined the challenge",
        challenge_no_active: "No active challenges",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        auth_register_btn: "Create account",
        auth_switch_to_register_text: "Don't have an account yet?",
        auth_switch_to_register_btn: "Register",
        auth_switch_to_login_text: "Already have an account?",
        auth_switch_to_login_btn: "Login",
        loading: "Loading...",

        auth_enter_name: "Enter your name.",
        auth_password_short: "Password must be at least 6 characters.",
        auth_password_mismatch: "Passwords do not match.",
        auth_error: "Something went wrong.",

        sidebar_categories: "Categories",
        sidebar_popular_tags: "Popular tags",
        copied: "Link copied",
        comments_empty: "No comments yet. Be the first.",
        search_placeholder: "Search illustrations, tags, authors...",
        copy_link: "Copy link",
        empty_filtered_posts: "Nothing found for the selected filters or search.",
        save: "Save",
        saved: "Saved",
        report: "Report",
        report_sent: "Report submitted",

        profile_home: "Home",
        profile_chats: "Chats",
        profile_saved: "Saved",
        profile_settings: "Settings",

        edit_profile: "Edit profile",
        follow: "Follow",
        unfollow: "Unfollow",
        message: "Message",

        profile_default_bio: "No description",
        profile_posts: "Posts",
        profile_posts_count: "posts",
        profile_likes_count: "likes",
        profile_followers_count: "followers",
        profile_no_posts: "This user has no posts yet.",

        edit_profile_title: "Edit profile",
        choose_avatar: "Choose avatar",
        remove_avatar: "Remove avatar",
        name: "Name",
        nick: "Nickname",
        bio: "Bio",
        save_changes: "Save",

        edit_post_title: "Edit post",
        delete: "Delete",
        edit: "Edit",

        delete_post_confirm: "Delete post",
        profile_load_error: "Failed to load profile",
        profile_update_error: "Failed to update profile",
        post_update_error: "Failed to update post",
        post_create_error: "Failed to create post",
        comment_add_error: "Failed to add comment",
        follow_error: "Failed to follow/unfollow",

        category_all: "All",
        category_digital_art: "Digital Art",
        category_fantasy: "Fantasy",
        category_cyberpunk: "Cyberpunk",
        category_nature: "Nature",
        category_game_art: "Game Art",
        category_characters: "Characters",
        category_concept_art: "Concept Art",
        category_sci_fi: "Sci-Fi",
        category_sketches: "Sketches",
        category_illustrations: "Illustrations",
        category_comics: "Comics",

        popular_communities: "Popular communities",
        community_members_1: "12,430 members",
        community_members_2: "8,920 members",
        community_members_3: "10,105 members",
        community_members_4: "6,740 members",
        join: "Join",

        challenge_of_day: "Challenge of the day",
        challenge_theme: "Theme",
        challenge_participants: "participants",
        challenge_works_today: "works today",
        join_challenge: "Join challenge",

        comments_title: "Comments",
        comment_placeholder: "Write a comment...",

        new_post: "New post",
        image: "Image",
        choose_file: "Choose file",
        title: "Title",
        category: "Category",
        choose_category: "Choose a category",
        tags: "Tags",
        tags_placeholder: "For example: fantasy, moon, portrait",
        cancel: "Cancel",
        publish: "Publish",
        send: "Send",
        upload: "Upload",

        search_results: "Search results",
        search_enter_author: "Enter the author's name or nickname.",
        search_empty: "Nothing found.",
        search_error: "Search error",

        settings_title: "Settings",
        settings_profile_tab: "Profile",
        settings_account_tab: "Account",
        settings_security_tab: "Security",
        settings_profile_title: "Profile",
        settings_account_title: "Account",
        logout: "Log out",
        logout_confirm: "Log out of your account?",

        saved_title: "Saved posts",
        saved_description: "All posts you marked as saved are stored here.",
        saved_count_label: "saved",
        saved_section_title: "Saved",
        saved_empty: "You don't have any saved posts yet.",
        saved_create_error: "Failed to create post",
        saved_comment_error: "Failed to add comment",

        chats_title: "Chats",
        chat_select: "Choose a chat",
        typing: "typing...",
        online: "online",
        offline: "offline",
        no_chats: "You don't have any chats yet.",
        no_messages: "No messages yet.",
        no_last_message: "No messages",
        message_placeholder: "Write a message..."
    }
};

function getCurrentLanguage() {
    return localStorage.getItem(I18N_STORAGE_KEY) || "uk";
}

function setCurrentLanguage(lang) {
    localStorage.setItem(I18N_STORAGE_KEY, lang);
}

function t(key) {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || translations.uk[key] || key;
}

function applyTranslations() {

    document
        .querySelectorAll("[data-i18n]")
        .forEach(element => {

            const key =
                element.dataset.i18n;

            element.textContent =
                t(key);
        });

    document
        .querySelectorAll("[data-i18n-placeholder]")
        .forEach(element => {

            const key =
                element.dataset.i18nPlaceholder;

            element.placeholder =
                t(key);
        });
}

function initLanguageSwitcher() {
    const switcher = document.getElementById("languageSwitcher");
    if (!switcher) return;

    switcher.value = getCurrentLanguage();

    switcher.addEventListener("change", () => {
        setCurrentLanguage(switcher.value);
        applyTranslations();

        document.dispatchEvent(new CustomEvent("languageChanged", {
            detail: { lang: getCurrentLanguage() }
        }));
    });
}

function initCustomLanguageDropdown() {
    const dropdown = document.getElementById("langDropdown");
    const btn = document.getElementById("langBtn");
    const currentLangText = document.getElementById("currentLang");

    if (!dropdown || !btn || !currentLangText) return;

    currentLangText.textContent = getCurrentLanguage().toUpperCase();

    btn.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("open");
    };

    document.onclick = (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove("open");
        }
    };

    dropdown.querySelectorAll(".lang-option").forEach(option => {
        option.onclick = () => {
            const lang = option.dataset.lang;

            setCurrentLanguage(lang);
            applyTranslations();

            document.dispatchEvent(new CustomEvent("languageChanged", {
                detail: { lang }
            }));

            dropdown.classList.remove("open");
        };
    });
}

window.ArtSpaceI18n = {
    t,
    getCurrentLanguage,
    setCurrentLanguage,
    applyTranslations,
    initLanguageSwitcher,
    initCustomLanguageDropdown
};