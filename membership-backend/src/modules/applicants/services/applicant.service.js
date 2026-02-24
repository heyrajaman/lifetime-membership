import crypto from "crypto";
import { sequelize, ApprovalToken, Member } from "../../../database/index.js";
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
