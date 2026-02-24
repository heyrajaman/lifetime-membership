import approvalService from "../services/approval.service.js";
import { processApprovalDto } from "../dtos/approval.dto.js";

class ApprovalController {
  async handleMemberApproval(req, res) {
    try {
      const validatedData = await processApprovalDto.validateAsync(req.body);
      const result = await approvalService.processApproval(
        validatedData.token,
        validatedData.action,
        "MEMBER",
      );
      return res.status(200).json(result);
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

  async handlePresidentApproval(req, res) {
    try {
      const validatedData = await processApprovalDto.validateAsync(req.body);
      const result = await approvalService.processApproval(
        validatedData.token,
        validatedData.action,
        "PRESIDENT",
      );
      return res.status(200).json(result);
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

  // Handles the GET request from the frontend when the page loads
  async verifyTokenAndGetDetails(req, res) {
    try {
      const { token } = req.params;
      const { role } = req.query; // The frontend must pass ?role=MEMBER or ?role=PRESIDENT

      if (!token || !role) {
        return res
          .status(400)
          .json({ success: false, message: "Token and role are required." });
      }

      // Fetch the details using the new service method
      const applicantData = await approvalService.getApplicantDetailsByToken(
        token,
        role.toUpperCase(),
      );

      return res.status(200).json({
        success: true,
        data: applicantData,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, message: error.message });
    }
  }
}

export default new ApprovalController();
