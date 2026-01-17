export const getUserId = () => {
    try {
        // 1. Check if user is logged in
        const sessionStore = localStorage.getItem("user_session");
        if (sessionStore) {
            const user = JSON.parse(sessionStore);
            // Return DB ID if available (synced user), else session ID (guest session)
            if (user.dbId) return user.dbId;
            if (user.id) return user.id;
        }

        // 2. If no login, use Guest ID
        let guestId = localStorage.getItem("guest_id");
        if (!guestId) {
            guestId = crypto.randomUUID ? crypto.randomUUID() : `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem("guest_id", guestId);
        }
        return guestId;

    } catch (error) {
        console.error("Error accessing localStorage for userId:", error);
        return `temp_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
