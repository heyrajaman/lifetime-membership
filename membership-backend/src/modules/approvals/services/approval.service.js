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
        applicant.status =
          expectedRole === "MEMBER"
            ? "REJECTED_BY_MEMBER"
            : "REJECTED_BY_PRESIDENT";
        await applicant.save({ transaction });
        await transaction.commit();
        return {
          success: true,
          message: `Application has been rejected by ${expectedRole.toLowerCase()}.`,
        };
      }

      // 4. Handle MEMBER APPROVAL logic
      if (expectedRole === "MEMBER" && action === "APPROVE") {
        applicant.status = "PENDING_PRESIDENT_APPROVAL";
        await applicant.save({ transaction });

        // Generate the NEXT token for the President
        const newRawToken = crypto.randomBytes(32).toString("hex");
        await ApprovalToken.create(
          {
            applicant_id: applicant.id,
            token: newRawToken,
            role_required: "PRESIDENT",
          },
          { transaction },
        );

        // Fetch President's email and send the secondary approval link
        const president = await Member.findOne({
          where: { role: "PRESIDENT" },
          transaction,
        });
        if (president) {
          await emailService.sendPresidentApprovalEmail(
            president.email,
            applicant.full_name,
            newRawToken,
          );
        }

        await transaction.commit();
        return {
          success: true,
          message: "Application approved by Member. Forwarded to President.",
        };
      }

      // 5. Handle PRESIDENT APPROVAL logic
      if (expectedRole === "PRESIDENT" && action === "APPROVE") {
        applicant.status = "PAYMENT_PENDING";
        await applicant.save({ transaction });

        // Generate a generic payment URL (We will integrate Razorpay tightly in Step 13)
        const paymentUrl = `${process.env.FRONTEND_URL}/payment?applicant_id=${applicant.id}`;
        await emailService.sendPaymentEmail(
          applicant.email,
          applicant.full_name,
          paymentUrl,
        );

        await transaction.commit();
        return {
          success: true,
          message:
            "Application approved by President. Payment link sent to applicant.",
        };
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Fetches full applicant details securely using only the email token
  async getApplicantDetailsByToken(tokenStr, expectedRole) {
    // Find the valid, unused token and join it with the full Applicant and Proposer data
    const tokenRecord = await ApprovalToken.findOne({
      where: { token: tokenStr, role_required: expectedRole },
      include: [
        {
          model: Applicant,
          as: "applicant",
          include: [
            { model: Member, as: "proposer", attributes: ["name"] },
            // If you imported FileUpload at the top, you can include files here too
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

    // Return the full applicant data so the frontend can display the form
    return {
      applicant: tokenRecord.applicant,
      is_used: tokenRecord.is_used,
    };
  }
}

export default new ApprovalService();
