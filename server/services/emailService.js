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
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                     <h1 style="color: #10b981; margin-bottom: 5px;">Aether Clinic</h1>
                     <p style="color: #666; margin: 0;">Your Intelligent Health Companion</p>
                </div>
                
                <h2 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Welcome, ${userName}! 👋</h2>
                
                <p>Thank you for signing in to <strong>AI Doctor</strong>. We are thrilled to have you on board!</p>
                
                <p>Your AI-powered health assistant is ready to help you analyze reports, assess risks, and answer your medical queries instantly.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173" 
                       style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                        Start Your Consultation
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="font-size: 12px; color: #888; text-align: center;">
                    You are receiving this email because you signed in to AI Doctor.<br>
                    This is an automated message. Please do not reply directly to this email.
                </p>
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
