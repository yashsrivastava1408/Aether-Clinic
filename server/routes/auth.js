import express from 'express';
import { sendWelcomeEmail } from '../services/emailService.js';

import User from '../models/User.js';

const router = express.Router();

// Login / Register User
router.post('/login', async (req, res) => {
    try {
        const { email, name, picture, googleId, isGuest } = req.body;
        console.log("👤 Login request:", email);

        let user = await User.findOne({ email });

        if (user) {
            // Update existing user
            console.log("♻️ Existing User Logged In:", email);
            user.name = name || user.name;
            user.picture = picture || user.picture;
            user.lastLogin = new Date();
            await user.save();
        } else {
            // Create new user
            user = new User({
                email,
                name: name || 'User',
                picture,
                googleId,
                isGuest: !!isGuest
            });
            await user.save();
            console.log("✨ New User Created:", user.name, `(${email})`);

            // Send Welcome Email for new users (Non-blocking)
            if (email && !isGuest) {
                console.log("📨 Triggering automated welcome email for:", email);
                sendWelcomeEmail(email, user.name).catch(err =>
                    console.error("📧 Background Email Error:", err)
                );
            } else {
                console.log("⏭️ Skipping email (Guest or Missing Email)");
            }
        }

        return res.json({ message: "Login successful", user });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});



router.post('/welcome', async (req, res) => {
    // Legacy endpoint (can be deprecated as login now handles it)
    const { email, name } = req.body;
    const result = await sendWelcomeEmail(email, name || 'User');
    res.json(result);
});

export default router;
