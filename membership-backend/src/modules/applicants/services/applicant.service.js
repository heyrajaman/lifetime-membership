import crypto from "crypto";
import {
  sequelize,
  ApprovalToken,
  Member,
  Applicant,
} from "../../../database/index.js";
import applicantRepository from "../repositories/applicant.repository.js";
import emailService from "../../common/services/email.service.js";

class ApplicantService {
  // Handles the entire workflow of submitting a new application
  async submitApplication(applicantData) {
    // Start a managed database transaction to ensure Atomicity
    const transaction = await sequelize.transaction();

    try {
      // 1. Save the applicant using our Repository
      const applicant = await applicantRepository.create(
        applicantData,
        transaction,
      );

      // 2. Generate a highly secure, random 64-character token for the email link
      const token = crypto.randomBytes(32).toString("hex");

      // 3. Create the approval token record linked to this applicant for the Proposer Member
      await ApprovalToken.create(
        {
          applicant_id: applicant.id,
          token: token,
          role_required: "MEMBER",
        },
        { transaction },
      );

      // 4. Fetch the proposer's email and trigger the initial approval email
      const proposer = await Member.findByPk(applicantData.proposer_member_id, {
        transaction,
      });
      if (proposer) {
        await emailService.sendMemberApprovalEmail(
          proposer.email,
          applicant.full_name,
          token,
        );
      }

      // 5. If everything above succeeds, commit the changes to the database permanently
      await transaction.commit();

      return applicant;
    } catch (error) {
      // If ANY step fails (e.g., token fails to save), rollback the entire process
      // This prevents "orphaned" applicants who have no approval token
      await transaction.rollback();
      throw error;
    }
  }

  async resubmitApplication(applicantId, updatedData) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Find the existing applicant
      const applicant = await Applicant.findByPk(applicantId, { transaction });
      if (!applicant) {
        throw { statusCode: 404, message: "Applicant not found." };
      }

      // 2. Security Check: Only allow edits if they were actually rejected by a Member
      if (applicant.status !== "REJECTED_BY_MEMBER") {
        throw {
          statusCode: 400,
          message: `Application cannot be edited in its current state: ${applicant.status}`,
        };
      }

      // 3. Update the applicant data and reset the status
      await applicant.update(
        {
          ...updatedData,
          status: "PENDING_MEMBER_APPROVAL", // Resetting the state machine!
        },
        { transaction },
      );

      // 4. Generate a fresh, secure approval token
      const newToken = crypto.randomBytes(32).toString("hex");

      // 5. Save the new token to the database
      await ApprovalToken.create(
        {
          applicant_id: applicant.id,
          token: newToken,
          role_required: "MEMBER",
        },
        { transaction },
      );

      // 6. Fetch the newly selected (or same) proposer's email
      const proposer = await Member.findByPk(
        updatedData.proposer_member_id || applicant.proposer_member_id,
        {
          transaction,
        },
      );

      // 7. Fire the email to the proposer so they can review the new data
      if (proposer) {
        await emailService.sendMemberApprovalEmail(
          proposer.email,
          applicant.full_name,
          newToken,
        );
      }

      await transaction.commit();
      return applicant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Retrieves an applicant and enforces a business rule (must exist)
  async getApplicantDetails(id) {
    const applicant = await applicantRepository.findById(id);
    if (!applicant) {
      const error = new Error("Applicant not found");
      error.statusCode = 404; // Custom property for our error handler later
      throw error;
    }
    return applicant;
  }

  // Retrieves all applicants for the Admin dashboard
  async getAllApplicants(filters = {}) {
    return await applicantRepository.findAll(filters);
  }
}

export default new ApplicantService();
