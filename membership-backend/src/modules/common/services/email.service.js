import nodemailer from "nodemailer";
import "../../../config/env.js";

class EmailService {
  constructor() {
    // Initialize the transporter with production-grade configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // 1. Sends the initial approval link to the Proposer Member
  async sendMemberApprovalEmail(memberEmail, applicantName, token) {
    // This is the exact URL your frontend partner needs to build to handle the token
    const approvalLink = `${process.env.FRONTEND_URL}/approve/member?token=${token}`;

    const mailOptions = {
      from: `"Maharashtra Mandal Raipur" <${process.env.SMTP_USER}>`,
      to: memberEmail,
      subject: "Action Required: New Membership Application Approval",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>New Membership Application</h2>
          <p>Dear Member,</p>
          <p>A new applicant, <strong>${applicantName}</strong>, has proposed your name as a reference for their Lifetime Membership.</p>
          <p>Please click the button below to securely review and approve or reject this application:</p>
          <a href="${approvalLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Review Application</a>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">If the button does not work, copy and paste this link into your browser: <br> ${approvalLink}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Member approval email queued for ${memberEmail}`);
    } catch (error) {
      console.error("❌ Error sending member approval email:", error);
      throw new Error("Email service failure.");
    }
  }

  // 2. Sends the secondary approval link to the President
  async sendPresidentApprovalEmail(presidentEmail, applicantName, token) {
    const approvalLink = `${process.env.FRONTEND_URL}/approve/president?token=${token}`;

    const mailOptions = {
      from: `"Maharashtra Mandal Raipur" <${process.env.SMTP_USER}>`,
      to: presidentEmail,
      subject: "Presidential Action Required: Membership Approval",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Membership Approved by Member</h2>
          <p>Dear President,</p>
          <p>The application for <strong>${applicantName}</strong> has been verified by the proposer.</p>
          <p>Please provide your final approval to proceed to the payment stage:</p>
          <a href="${approvalLink}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Review Final Application</a>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 3. Sends the final payment link to the Applicant
  async sendPaymentEmail(applicantEmail, applicantName, paymentUrl) {
    const mailOptions = {
      from: `"Maharashtra Mandal Raipur" <${process.env.SMTP_USER}>`,
      to: applicantEmail,
      subject: "Application Approved! Complete Your Payment",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Congratulations, ${applicantName}!</h2>
          <p>Your Lifetime Membership application has been fully approved by the Maharashtra Mandal committee.</p>
          <p>To finalize your membership, please complete the secure online payment of ₹1510:</p>
          <a href="${paymentUrl}" style="display: inline-block; padding: 10px 20px; background-color: #ff9900; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Pay ₹1510 Now</a>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export default new EmailService();
