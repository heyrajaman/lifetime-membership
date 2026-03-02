import crypto from "crypto";
import {
  sequelize,
  ApprovalToken,
  Member,
  Applicant,
  FileUpload, // <-- NEW: Imported FileUpload model
} from "../../../database/index.js";
import applicantRepository from "../repositories/applicant.repository.js";
import emailService from "../../common/services/email.service.js";

class ApplicantService {
  // Handles the entire workflow of submitting a new application
  async submitApplication(applicantData) {
    const transaction = await sequelize.transaction();

    try {
      const applicant = await applicantRepository.create(
        applicantData,
        transaction,
      );

      const token = crypto.randomBytes(32).toString("hex");

      await ApprovalToken.create(
        {
          applicant_id: applicant.id,
          token: token,
          role_required: "MEMBER",
        },
        { transaction },
      );

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

      await transaction.commit();
      return applicant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // --- UPDATED: Handles resubmission for BOTH Member and Admin rejections ---
  async resubmitApplication(applicantId, updatedData) {
    const transaction = await sequelize.transaction();

    try {
      const applicant = await Applicant.findByPk(applicantId, { transaction });
      if (!applicant) {
        throw { statusCode: 404, message: "Applicant not found." };
      }

      // --- NEW FIX: Handle new file uploads during resubmission ---
      if (updatedData.files && updatedData.files.length > 0) {
        for (const newFile of updatedData.files) {
          // 1. Delete the old file record of this specific type (e.g., old AADHAR_FRONT)
          await FileUpload.destroy({
            where: { applicant_id: applicantId, file_type: newFile.file_type },
            transaction,
          });

          // 2. Insert the new file record
          await FileUpload.create(
            {
              applicant_id: applicantId,
              file_type: newFile.file_type,
              minio_url: newFile.minio_url,
            },
            { transaction },
          );
        }
      }

      // SCENARIO 1: Rejected by Member
      if (applicant.status === "REJECTED_BY_MEMBER") {
        await applicant.update(
          {
            ...updatedData,
            status: "PENDING_MEMBER_APPROVAL", // Goes back to Proposer
          },
          { transaction },
        );

        const newToken = crypto.randomBytes(32).toString("hex");
        await ApprovalToken.create(
          {
            applicant_id: applicant.id,
            token: newToken,
            role_required: "MEMBER",
          },
          { transaction },
        );

        const proposer = await Member.findByPk(
          updatedData.proposer_member_id || applicant.proposer_member_id,
          { transaction },
        );

        if (proposer) {
          await emailService.sendMemberApprovalEmail(
            proposer.email,
            applicant.full_name,
            newToken,
          );
        }
      }
      // SCENARIO 2: Rejected by Admin
      else if (applicant.status === "REJECTED_BY_ADMIN") {
        await applicant.update(
          {
            ...updatedData,
            status: "PENDING_ADMIN_REVIEW", // Goes straight back to Admin dashboard
          },
          { transaction },
        );
      }
      // SCENARIO 3: Illegal state
      else {
        throw {
          statusCode: 400,
          message: `Application cannot be edited in its current state: ${applicant.status}`,
        };
      }

      await transaction.commit();
      return applicant;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getApplicantDetails(id) {
    const applicant = await applicantRepository.findById(id);
    if (!applicant) {
      const error = new Error("Applicant not found");
      error.statusCode = 404;
      throw error;
    }
    return applicant;
  }

  async getAllApplicants(filters = {}) {
    return await applicantRepository.findAll(filters);
  }
}

export default new ApplicantService();
