import applicantService from "../services/applicant.service.js";
import createApplicantDto from "../dtos/applicant.dto.js";
import storageService from "../../common/services/storage.service.js";

class ApplicantController {
  // Handles the POST /api/applicants endpoint
  async createApplicant(req, res) {
    try {
      // 1. Validate the text fields
      const validatedData = await createApplicantDto.validateAsync(req.body, {
        abortEarly: false,
      });

      // 2. Ensure files were actually uploaded
      if (
        !req.files ||
        !req.files["applicant_photo"] ||
        !req.files["applicant_signature"] ||
        !req.files["aadhar_front"] ||
        !req.files["aadhar_back"]
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Photo, signature, and both sides of Aadhar card are required.",
        });
      }

      // 3. Upload files to MinIO and get their permanent URLs
      const photoUrl = await storageService.uploadToMinio(
        req.files["applicant_photo"][0],
      );
      const signatureUrl = await storageService.uploadToMinio(
        req.files["applicant_signature"][0],
      );
      const aadharFrontUrl = await storageService.uploadToMinio(
        req.files["aadhar_front"][0],
      );
      const aadharBackUrl = await storageService.uploadToMinio(
        req.files["aadhar_back"][0],
      );

      // 4. Attach the file data to the payload for the Service layer
      validatedData.files = [
        { file_type: "PHOTO", minio_url: photoUrl },
        { file_type: "SIGNATURE", minio_url: signatureUrl },
        { file_type: "AADHAR_FRONT", minio_url: aadharFrontUrl },
        { file_type: "AADHAR_BACK", minio_url: aadharBackUrl },
      ];

      // 5. Pass to Service Layer
      const newApplicant =
        await applicantService.submitApplication(validatedData);

      // 3. Send a successful HTTP 201 (Created) response back to the client
      return res.status(201).json({
        success: true,
        message: "Application submitted successfully. Pending member approval.",
        data: {
          id: newApplicant.id,
          status: newApplicant.status,
        },
      });
    } catch (error) {
      // 4. Handle Joi Validation Errors specifically (HTTP 400 Bad Request)
      if (error.isJoi) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.details.map((err) => err.message),
        });
      }
      // 2. --- NEW: Catch Database Duplicate Errors ---
      if (error.name === "SequelizeUniqueConstraintError") {
        const duplicateField = error.errors[0].path; // e.g., 'mobile_number' or 'aadhar_card'
        let customMessage = "This record already exists.";

        if (duplicateField === "mobile_number") {
          customMessage =
            "हा मोबाईल नंबर आधीच नोंदणीकृत आहे. (This mobile number is already registered.)";
        } else if (duplicateField === "email") {
          customMessage =
            "हा ई-मेल आधीच नोंदणीकृत आहे. (This email is already registered.)";
        }
        return res.status(400).json({
          success: false,
          message: customMessage,
        });
      }
      // 5. Handle unexpected Server Errors (HTTP 500)
      console.error("Error in createApplicant controller:", error);
      return res.status(500).json({
        success: false,
        message:
          "An internal server error occurred while processing the application.",
      });
    }
  }

  // Handles the POST /api/v1/applicants/admin-submit endpoint
  async createApplicantByAdmin(req, res) {
    try {
      const validatedData = await createApplicantDto.validateAsync(req.body, {
        abortEarly: false,
      });

      if (
        !req.files ||
        !req.files["applicant_photo"] ||
        !req.files["applicant_signature"] ||
        !req.files["aadhar_front"] ||
        !req.files["aadhar_back"]
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Photo, signature, and both sides of Aadhar card are required.",
        });
      }

      const photoUrl = await storageService.uploadToMinio(
        req.files["applicant_photo"][0],
      );
      const signatureUrl = await storageService.uploadToMinio(
        req.files["applicant_signature"][0],
      );
      const aadharFrontUrl = await storageService.uploadToMinio(
        req.files["aadhar_front"][0],
      );
      const aadharBackUrl = await storageService.uploadToMinio(
        req.files["aadhar_back"][0],
      );

      validatedData.files = [
        { file_type: "PHOTO", minio_url: photoUrl },
        { file_type: "SIGNATURE", minio_url: signatureUrl },
        { file_type: "AADHAR_FRONT", minio_url: aadharFrontUrl },
        { file_type: "AADHAR_BACK", minio_url: aadharBackUrl },
      ];

      const newApplicant =
        await applicantService.submitApplication(validatedData);

      return res.status(201).json({
        success: true,
        message:
          "Application submitted successfully by Admin. Pending member approval.",
        data: { id: newApplicant.id, status: newApplicant.status },
      });
    } catch (error) {
      if (error.isJoi) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.details.map((err) => err.message),
        });
      }
      console.error("Error in createApplicantByAdmin controller:", error);
      return res.status(500).json({
        success: false,
        message:
          "An internal server error occurred while processing the admin submission.",
      });
    }
  }

  // Handles the PUT /api/v1/applicants/:id endpoint for resubmissions
  async resubmitApplicant(req, res) {
    try {
      const { id } = req.params;

      // 1. Validate the incoming edited text fields
      const validatedData = await createApplicantDto.validateAsync(req.body, {
        abortEarly: false,
      });

      // 2. Check if the applicant uploaded new files during the edit
      if (req.files) {
        const newFiles = [];
        if (req.files["applicant_photo"]) {
          const photoUrl = await storageService.uploadToMinio(
            req.files["applicant_photo"][0],
          );
          newFiles.push({ file_type: "PHOTO", minio_url: photoUrl });
        }
        if (req.files["applicant_signature"]) {
          const signatureUrl = await storageService.uploadToMinio(
            req.files["applicant_signature"][0],
          );
          newFiles.push({ file_type: "SIGNATURE", minio_url: signatureUrl });
        }

        if (req.files["aadhar_front"]) {
          const aadharFrontUrl = await storageService.uploadToMinio(
            req.files["aadhar_front"][0],
          );
          newFiles.push({
            file_type: "AADHAR_FRONT",
            minio_url: aadharFrontUrl,
          });
        }
        if (req.files["aadhar_back"]) {
          const aadharBackUrl = await storageService.uploadToMinio(
            req.files["aadhar_back"][0],
          );
          newFiles.push({ file_type: "AADHAR_BACK", minio_url: aadharBackUrl });
        }

        // If new files were uploaded, attach them to be processed
        if (newFiles.length > 0) {
          validatedData.files = newFiles;
        }
      }

      // 3. Pass the ID and the new data to the Service Layer
      const updatedApplicant = await applicantService.resubmitApplication(
        id,
        validatedData,
      );

      return res.status(200).json({
        success: true,
        message:
          "Application resubmitted successfully. A new approval link has been sent to the Proposer.",
        data: {
          id: updatedApplicant.id,
          status: updatedApplicant.status,
        },
      });
    } catch (error) {
      if (error.isJoi) {
        return res.status(400).json({
          success: false,
          message: "Validation failed on edited data",
          errors: error.details.map((err) => err.message),
        });
      }

      console.error("Error in resubmitApplicant controller:", error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message:
          error.message ||
          "An internal server error occurred while resubmitting.",
      });
    }
  }

  // Handles the GET /api/applicants endpoint (For Admin Dashboard)
  async getApplicants(req, res) {
    try {
      const applicants = await applicantService.getAllApplicants();

      return res.status(200).json({
        success: true,
        data: applicants,
      });
    } catch (error) {
      console.error("Error in getApplicants controller:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // Handles the GET /api/applicants/:id endpoint
  async getApplicantById(req, res) {
    try {
      // Extract the ID from the URL parameters
      const { id } = req.params;

      const applicant = await applicantService.getApplicantDetails(id);

      return res.status(200).json({
        success: true,
        data: applicant,
      });
    } catch (error) {
      // If the service threw a 404 error, we catch it here and return the correct HTTP status
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

export default new ApplicantController();
