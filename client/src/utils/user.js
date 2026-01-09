export const getUserId = () => {
    let userId = localStorage.getItem("ai_doctor_user_id");
    if (!userId) {
        userId = crypto.randomUUID ? crypto.randomUUID() : `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("ai_doctor_user_id", userId);
    }
    return userId;
};
