// // backend/services/emailService.js
// export const sendVerificationEmail = async (email, token, username) => {
//   try {
//     const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
//     const emailData = {
//       to_email: email,
//       from_name: "Kobutor",
//       subject: 'Verify Your Kobutor Account',
//       message: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #2563eb;">Welcome to Kobutor! 🕊️</h2>
//           <p>Hello ${username},</p>
//           <p>Thank you for signing up for Kobutor. Please verify your email address to start using your account.</p>
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${verificationUrl}" 
//                style="background-color: #2563eb; color: white; padding: 12px 24px; 
//                       text-decoration: none; border-radius: 6px; display: inline-block;">
//               Verify Email Address
//             </a>
//           </div>
//           <p>Or copy and paste this link in your browser:</p>
//           <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
//           <p>This link will expire in 24 hours.</p>
//           <p>If you didn't create an account with Kobutor, please ignore this email.</p>
//           <br/>
//           <p>Happy messaging!<br/>The Kobutor Team</p>
//         </div>
//       `,
//       to_name: username
//     };

//     const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         service_id: process.env.EMAILJS_SERVICE_ID,
//         template_id: process.env.EMAILJS_TEMPLATE_ID,
//         user_id: process.env.EMAILJS_PUBLIC_KEY,
//         accessToken: process.env.EMAILJS_PRIVATE_KEY,
//         template_params: emailData
//       })
//     });

//     if (response.ok) {
//       console.log(`✅ Email delivered via EmailJS to ${email}`);
//       return await response.json();
//     } else {
//       const error = await response.text();
//       console.error('❌ EmailJS error:', error);
//       throw new Error('Failed to send email');
//     }
    
//   } catch (error) {
//     console.error('❌ Email sending error:', error);
    
//     // Fallback
//     const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
//     console.log('🎯 Verification URL:', verificationUrl);
    
//     throw new Error('Failed to send verification email');
//   }
// };