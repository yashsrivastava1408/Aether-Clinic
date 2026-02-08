import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use 'SMTP' with host/port if not Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ Email Server Error:", error);
        console.log("⚠️ Make sure EMAIL_USER and EMAIL_PASS are set correctly in .env");
    } else {
        console.log("✅ Email Server is ready to take messages");
        console.log(`   Sender: ${process.env.EMAIL_USER || 'Not Set'}`);
    }
});

export const sendWelcomeEmail = async (toEmail, userName) => {
    console.log(`📩 Attempting to send welcome email to: ${toEmail}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ Missing email credentials in .env");
        return { success: false, message: 'Server missing email credentials' };
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Welcome to Aether Clinic 👨‍⚕️ | Your Health Companion',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc; background-color: #0f172a; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
                <!-- Header with Gradient Area -->
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">Aether Clinic</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">Your Digital Health Sanctuary</p>
                </div>

                <div style="padding: 32px 24px;">
                    <h2 style="color: #ffffff; font-weight: 600; margin-bottom: 16px;">Welcome, ${userName}! 👋</h2>
                    
                    <p style="line-height: 1.6; color: #94a3b8; font-size: 16px;">
                        Congratulations! You have just gained access to the next generation of healthcare. <strong>Aether Clinic</strong> is your AI-powered companion, designed to provide instant medical clarity with total privacy.
                    </p>

                    <div style="margin: 32px 0; background-color: #1e293b; border-radius: 12px; padding: 20px;">
                        <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #10b981; letter-spacing: 1px;">Core Capabilities</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; color: #cbd5e1;">
                            <li style="margin-bottom: 8px;">🔹 <strong>Report Analysis:</strong> Upload reports for instant, human-friendly breakdowns.</li>
                            <li style="margin-bottom: 8px;">🔹 <strong>Risk Prediction:</strong> Proactive screening for Heart and Diabetes health.</li>
                            <li>🔹 <strong>AI Consultation:</strong> 24/7 medical query resolution at your fingertips.</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin: 40px 0;">
                        <a href="http://localhost:5173" 
                           style="display: inline-block; padding: 16px 36px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);">
                            Begin Your Consultation
                        </a>
                    </div>

                    <hr style="border: 0; border-top: 1px solid #334155; margin: 32px 0;">
                    
                    <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                        This is an automated system notification from Aether Clinic.<br>
                        Your data is encrypted and remains under your control.
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent: ' + info.response);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, message: 'Failed to send email', error };
    }
};
