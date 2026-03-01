import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // <-- NEW IMPORT
import pdfService from "../../common/services/pdf.service.js";
import emailService from "../../common/services/email.service.js";
import {
  Admin,
  Member,
  Applicant,
  sequelize,
  FileUpload,
  Setting,
  ApprovalToken, // <-- NEW IMPORT
} from "../../../database/index.js";
import "../../../config/env.js";
import { Op } from "sequelize";

class AdminService {
  async login(phone_number, password) {
    const admin = await Admin.findOne({ where: { phone_number } });
    if (!admin) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    const token = jwt.sign(
      { id: admin.id, phone_number: admin.phone_number, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    return {
      token,
      admin: { id: admin.id, phone_number: admin.phone_number },
    };
  }

  // --- NEW: Admin edits applicant details before approval ---
  async updateApplicantDetails(applicantId, updateData) {
    const applicant = await Applicant.findByPk(applicantId);
    if (!applicant) {
      throw { statusCode: 404, message: "Applicant not found." };
    }

    // Update the record with the new text fields sent by the admin
    await applicant.update(updateData);
    return applicant;
  }

  // --- NEW: Admin Approves or Rejects the application ---
  async processAdminReview(applicantId, action) {
    const transaction = await sequelize.transaction();

    try {
      const applicant = await Applicant.findByPk(applicantId, { transaction });
      if (!applicant) {
        throw { statusCode: 404, message: "Applicant not found." };
      }

      if (applicant.status !== "PENDING_ADMIN_REVIEW") {
        throw {
          statusCode: 400,
          message: `Cannot review. Application is currently: ${applicant.status}`,
        };
      }

      if (action === "REJECT") {
        applicant.status = "REJECTED_BY_ADMIN";
        await applicant.save({ transaction });

        const editUrl = `${process.env.FRONTEND_URL}/edit-application/${applicant.id}`;

        // We will create this email method in the next step!
        await emailService.sendAdminRejectionEmail(
          applicant.email,
          applicant.full_name,
          editUrl,
        );

        await transaction.commit();
        return {
          success: true,
          message:
            "Application rejected. Email sent to applicant for corrections.",
        };
      }

      if (action === "APPROVE") {
        applicant.status = "PENDING_PRESIDENT_APPROVAL";
        await applicant.save({ transaction });

        // Generate the token for the President
        const newRawToken = crypto.randomBytes(32).toString("hex");
        await ApprovalToken.create(
          {
            applicant_id: applicant.id,
            token: newRawToken,
            role_required: "PRESIDENT",
          },
          { transaction },
        );

        // Fetch President's email and send the link
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
          message:
            "Application verified by Admin. Forwarded to President for approval.",
        };
      }

      throw {
        statusCode: 400,
        message: "Invalid action. Use APPROVE or REJECT.",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ... (All other existing methods remain unchanged)
  async getAllProposers(searchTerm = "") {
    const whereClause = { role: "MEMBER", is_active: true };
    if (searchTerm) {
      whereClause.name = { [Op.like]: `%${searchTerm}%` };
    }
    return await Member.findAll({
      where: whereClause,
      attributes: ["id", "name", "mobile_number"],
      order: [["name", "ASC"]],
      limit: 10,
    });
  }

  async getAllMembersForAdmin() {
    return await Member.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "mobile_number",
        "role",
        "is_active",
        "createdAt",
      ],
      order: [["name", "ASC"]],
    });
  }

  async toggleMemberStatus(memberId) {
    const member = await Member.findByPk(memberId);
    if (!member) throw { statusCode: 404, message: "Member not found." };
    if (member.role === "PRESIDENT")
      throw { statusCode: 400, message: "Cannot change President status." };

    member.is_active = !member.is_active;
    await member.save();
    return {
      success: true,
      message: `${member.name} is now ${member.is_active ? "Active" : "Inactive"}.`,
    };
  }

  async approveAndPromoteToMember(applicantId, registrationNumber) {
    const transaction = await sequelize.transaction();
    try {
      const applicant = await Applicant.findByPk(applicantId, {
        include: [{ model: FileUpload, as: "files" }],
        transaction,
      });
      if (!applicant)
        throw { statusCode: 404, message: "Applicant not found." };
      if (applicant.status !== "PAYMENT_COMPLETED")
        throw {
          statusCode: 400,
          message: `Applicant cannot be promoted. Current status is ${applicant.status}. Payment must be completed first.`,
        };

      const existingReg = await Applicant.findOne({
        where: { registration_number: registrationNumber },
        transaction,
      });
      if (existingReg)
        throw {
          statusCode: 400,
          message: "This Registration Number is already assigned.",
        };

      applicant.registration_number = registrationNumber;
      applicant.status = "MEMBER";
      await applicant.save({ transaction });

      const existingMember = await Member.findOne({
        where: {
          [Op.or]: [
            { email: applicant.email },
            { mobile_number: applicant.mobile_number },
          ],
        },
        transaction,
      });

      if (!existingMember) {
        await Member.create(
          {
            name: applicant.full_name,
            email: applicant.email,
            mobile_number: applicant.mobile_number,
            role: "MEMBER",
          },
          { transaction },
        );
      }

      const photoFile = applicant.files?.find((f) => f.file_type === "PHOTO");
      const memberDataForPdf = {
        name: applicant.full_name,
        registration_number: registrationNumber,
        mobile_number: applicant.mobile_number,
        email: applicant.email,
        address: applicant.current_address,
        photo_url: photoFile ? photoFile.minio_url : null,
      };

      const pdfBuffer = await pdfService.generateIdCardBuffer(memberDataForPdf);
      await emailService.sendWelcomeEmailWithIdCard(
        applicant.email,
        applicant.full_name,
        pdfBuffer,
        registrationNumber,
      );

      await transaction.commit();
      return {
        success: true,
        message: `Successfully promoted ${applicant.full_name} to official Member with Registration Number: ${registrationNumber}`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateMemberIdCard(memberId) {
    const member = await Member.findByPk(memberId);
    if (!member) throw { statusCode: 404, message: "Member not found." };

    const applicant = await Applicant.findOne({
      where: { email: member.email },
      include: [{ model: FileUpload, as: "files" }],
    });
    if (!applicant)
      throw {
        statusCode: 404,
        message: "Original application details not found.",
      };

    const photoFile = applicant.files?.find((f) => f.file_type === "PHOTO");
    const memberData = {
      name: member.name,
      registration_number: applicant.registration_number || "N/A",
      mobile_number: member.mobile_number,
      email: member.email,
      address: applicant.current_address,
      photo_url: photoFile ? photoFile.minio_url : null,
    };

    const pdfBuffer = await pdfService.generateIdCardBuffer(memberData);
    return {
      buffer: pdfBuffer,
      registrationNumber: applicant.registration_number || "ID",
    };
  }

  async getSystemSettings() {
    return await Setting.findAll();
  }

  async updateMembershipFee(newValue) {
    if (!newValue || isNaN(newValue) || newValue <= 0)
      throw { statusCode: 400, message: "Invalid fee amount." };

    const setting = await Setting.findByPk("LIFETIME_MEMBERSHIP_FEE");
    if (!setting) {
      await Setting.create({
        key: "LIFETIME_MEMBERSHIP_FEE",
        value: newValue.toString(),
      });
    } else {
      setting.value = newValue.toString();
      await setting.save();
    }
    return {
      success: true,
      message: `Membership fee updated to ₹${newValue} successfully.`,
    };
  }
}

export default new AdminService();
