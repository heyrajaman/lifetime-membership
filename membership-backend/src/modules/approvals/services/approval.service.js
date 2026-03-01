import crypto from "crypto";
import {
  sequelize,
  Applicant,
  ApprovalToken,
  Member,
  FileUpload,
} from "../../../database/index.js";
import emailService from "../../common/services/email.service.js";

class ApprovalService {
  // Handles the state transitions based on who is approving and what action they take
  async processApproval(tokenStr, action, expectedRole) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validate the token
      const tokenRecord = await ApprovalToken.findOne({
        where: { token: tokenStr, role_required: expectedRole, is_used: false },
        include: [{ model: Applicant, as: "applicant" }],
        transaction,
      });

      if (!tokenRecord) {
        const error = new Error(
          "Invalid, expired, or already used approval token.",
        );
        error.statusCode = 400;
        throw error;
      }

      const applicant = tokenRecord.applicant;

      // 2. Consume the token so it cannot be used twice
      tokenRecord.is_used = true;
      await tokenRecord.save({ transaction });

      // 3. Handle REJECTION logic (Applies to both Member and President)
      if (action === "REJECT") {
        if (expectedRole === "MEMBER") {
          applicant.status = "REJECTED_BY_MEMBER";
          await applicant.save({ transaction });

          // Generate an edit URL for the frontend to load this specific application
          const editUrl = `${process.env.FRONTEND_URL}/edit-application/${applicant.id}`;

          await emailService.sendMemberRejectionEmail(
            applicant.email,
            applicant.full_name,
            editUrl,
          );
        } else if (expectedRole === "PRESIDENT") {
          applicant.status = "REJECTED_BY_PRESIDENT";
          await applicant.save({ transaction });

          await emailService.sendPresidentRejectionEmail(
            applicant.email,
            applicant.full_name,
          );
        }

        await transaction.commit();
        return {
          success: true,
          message: `Application has been rejected by ${expectedRole.toLowerCase()}. Notification sent to applicant.`,
        };
      }

      // 4. Handle MEMBER APPROVAL logic (Now goes to ADMIN)
      if (expectedRole === "MEMBER" && action === "APPROVE") {
        applicant.status = "PENDING_ADMIN_REVIEW"; // <-- CHANGED
        await applicant.save({ transaction });

        // Note: We DO NOT generate the President token here anymore.
        // The Admin will do that after verifying the form in the dashboard.

        await transaction.commit();
        return {
          success: true,
          message:
            "Application approved by Member. Forwarded to Admin for review.",
        };
      }

      // 5. Handle PRESIDENT APPROVAL logic (Goes to Applicant Recheck/Payment)
      if (expectedRole === "PRESIDENT" && action === "APPROVE") {
        applicant.status = "PAYMENT_PENDING";
        await applicant.save({ transaction });

        // Generate a URL for the read-only recheck form with the payment button
        const recheckUrl = `${process.env.FRONTEND_URL}/recheck-application/${applicant.id}`;

        await emailService.sendPaymentEmail(
          applicant.email,
          applicant.full_name,
          recheckUrl,
        );

        await transaction.commit();
        return {
          success: true,
          message:
            "Application approved by President. Form recheck & payment link sent to applicant.",
        };
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Fetches full applicant details securely using only the email token
  async getApplicantDetailsByToken(tokenStr, expectedRole) {
    const tokenRecord = await ApprovalToken.findOne({
      where: { token: tokenStr, role_required: expectedRole },
      include: [
        {
          model: Applicant,
          as: "applicant",
          include: [
            { model: Member, as: "proposer", attributes: ["name"] },
            {
              model: FileUpload,
              as: "files",
              attributes: ["file_type", "minio_url"],
            },
          ],
        },
      ],
    });

    if (!tokenRecord) {
      const error = new Error(
        "This approval link is invalid, expired, or has already been processed.",
      );
      error.statusCode = 404;
      throw error;
    }

    return {
      applicant: tokenRecord.applicant,
      is_used: tokenRecord.is_used,
    };
  }
}

export default new ApprovalService();
