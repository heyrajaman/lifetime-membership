import adminService from "../services/admin.service.js";
import { adminLoginDto } from "../dtos/admin.dto.js";

class AdminController {
  async login(req, res) {
    try {
      const validatedData = await adminLoginDto.validateAsync(req.body);

      const result = await adminService.login(
        validatedData.phone_number,
        validatedData.password,
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.isJoi)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, message: error.message });
    }
  }

  async getProposers(req, res) {
    try {
      // Extract search from the URL query parameters
      const searchTerm = req.query.search || "";

      const members = await adminService.getAllProposers(searchTerm);

      return res.status(200).json({ success: true, data: members });
    } catch (error) {
      console.error("Error fetching proposers:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch proposers list." });
    }
  }

  // Handles GET request for the Admin to see all members (Active & Inactive)
  async getAllMembersAdmin(req, res) {
    try {
      const members = await adminService.getAllMembersForAdmin();
      return res.status(200).json({ success: true, data: members });
    } catch (error) {
      console.error("Error fetching admin member list:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch members list.",
      });
    }
  }

  // Handles PATCH request to toggle member status
  async toggleMemberStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await adminService.toggleMemberStatus(id);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error toggling member status:", error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to toggle status.",
      });
    }
  }

  async promoteApplicant(req, res) {
    try {
      const { applicant_id, registration_number } = req.body;

      // Basic validation
      if (!applicant_id || !registration_number) {
        return res.status(400).json({
          success: false,
          message:
            "Applicant ID and Registration Number are completely required.",
        });
      }

      const result = await adminService.approveAndPromoteToMember(
        applicant_id,
        registration_number,
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error promoting applicant:", error);
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, message: error.message });
    }
  }

  // Handles the GET request to download the ID card
  async downloadIdCard(req, res) {
    try {
      const { id } = req.params;

      // 1. Get the raw PDF buffer and Registration Number from the Service
      const { buffer, registrationNumber } =
        await adminService.generateMemberIdCard(id);

      // 2. Set the HTTP headers to tell the browser this is a PDF file download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="ID_Card_${registrationNumber}.pdf"`,
      );
      res.setHeader("Content-Length", buffer.length);

      // 3. Stream the file back to the client
      return res.end(buffer);
    } catch (error) {
      console.error("Error generating ID card:", error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to generate ID card.",
      });
    }
  }

  async getSettings(req, res) {
    try {
      const settings = await adminService.getSystemSettings();
      return res.status(200).json({ success: true, data: settings });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch settings." });
    }
  }

  async updateFee(req, res) {
    try {
      const { amount } = req.body;
      const result = await adminService.updateMembershipFee(amount);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
