import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pdfService from "../../common/services/pdf.service.js";
import emailService from "../../common/services/email.service.js";
import {
  Admin,
  Member,
  Applicant,
  sequelize,
  FileUpload,
} from "../../../database/index.js";
import "../../../config/env.js";
import { Op } from "sequelize";
class AdminService {
  async login(phone_number, password) {
    // 1. Find the admin by phone number
    const admin = await Admin.findOne({ where: { phone_number } });
    if (!admin) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    // 2. Verify the hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    // 3. Generate the JWT token
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

  async getAllProposers(searchTerm = "") {
    const whereClause = { role: "MEMBER", is_active: true };

    if (searchTerm) {
      whereClause.name = {
        [Op.like]: `%${searchTerm}%`,
      };
    }

    const members = await Member.findAll({
      where: whereClause,
      attributes: ["id", "name", "mobile_number"],
      order: [["name", "ASC"]],
      limit: 10, // Only return the top 10 closest matches for performance
    });

    return members;
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
    if (!member) {
      throw { statusCode: 404, message: "Member not found." };
    }

    // Safety check: Prevent disabling the President
    if (member.role === "PRESIDENT") {
      throw {
        statusCode: 400,
        message: "Cannot change the status of the President.",
      };
    }

    // Flip the boolean value
    member.is_active = !member.is_active;
    await member.save();

    return {
      success: true,
      message: `${member.name} is now ${member.is_active ? "Active" : "Inactive"}.`,
      data: {
        id: member.id,
        is_active: member.is_active,
      },
    };
  }

  async approveAndPromoteToMember(applicantId, registrationNumber) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Find the applicant
      const applicant = await Applicant.findByPk(applicantId, {
        include: [{ model: FileUpload, as: "files" }],
        transaction,
      });
      if (!applicant) {
        throw { statusCode: 404, message: "Applicant not found." };
      }

      // 2. Ensure they have completed payment
      if (applicant.status !== "PAYMENT_COMPLETED") {
        throw {
          statusCode: 400,
          message: `Applicant cannot be promoted. Current status is ${applicant.status}. Payment must be completed first.`,
        };
      }

      // 3. Check if the registration number is already in use
      const existingReg = await Applicant.findOne({
        where: { registration_number: registrationNumber },
        transaction,
      });
      if (existingReg) {
        throw {
          statusCode: 400,
          message:
            "This Registration Number is already assigned to another member.",
        };
      }

      // 4. Update the Applicant's final status and assign the number
      applicant.registration_number = registrationNumber;
      applicant.status = "MEMBER";
      await applicant.save({ transaction });

      // 5. Check if they already exist in the Member table (prevent duplicate emails OR mobile numbers)
      const existingMember = await Member.findOne({
        where: {
          [Op.or]: [
            { email: applicant.email },
            { mobile_number: applicant.mobile_number },
          ],
        },
        transaction,
      });

      // 6. Create the Official Member record so they can become a Proposer
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

      // Draw the PDF in memory
      const pdfBuffer = await pdfService.generateIdCardBuffer(memberDataForPdf);

      // Email the PDF to the newly promoted applicant
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

  // Generates the ID Card PDF on-the-fly for a specific member
  async generateMemberIdCard(memberId) {
    // 1. Fetch the Member
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw { statusCode: 404, message: "Member not found." };
    }

    // 2. Fetch their original Applicant profile to get the photo and address
    const applicant = await Applicant.findOne({
      where: { email: member.email },
      include: [{ model: FileUpload, as: "files" }],
    });

    if (!applicant) {
      throw {
        statusCode: 404,
        message: "Original application details not found for this member.",
      };
    }

    // 3. Extract the Photo URL from the attached files
    const photoFile = applicant.files?.find((f) => f.file_type === "PHOTO");

    // 4. Construct the unified payload for the PDF Engine
    const memberData = {
      name: member.name,
      registration_number: applicant.registration_number || "N/A",
      mobile_number: member.mobile_number,
      email: member.email,
      address: applicant.current_address,
      photo_url: photoFile ? photoFile.minio_url : null,
    };

    // 5. Generate the PDF buffer in memory
    const pdfBuffer = await pdfService.generateIdCardBuffer(memberData);

    return {
      buffer: pdfBuffer,
      registrationNumber: applicant.registration_number || "ID",
    };
  }

  // NEW: Fetch current system settings (like the fee)
  async getSystemSettings() {
    return await Setting.findAll();
  }

  // NEW: Update the membership fee
  async updateMembershipFee(newValue) {
    if (!newValue || isNaN(newValue) || newValue <= 0) {
      throw {
        statusCode: 400,
        message: "Please provide a valid numeric fee amount.",
      };
    }

    const setting = await Setting.findByPk("LIFETIME_MEMBERSHIP_FEE");
    if (!setting) {
      // Create it if it doesn't exist for some reason
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
