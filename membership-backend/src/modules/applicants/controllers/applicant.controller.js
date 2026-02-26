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
        !req.files["applicant_signature"]
      ) {
        return res.status(400).json({
          success: false,
          message: "Photo and signature are required.",
        });
      }

      // 3. Upload files to MinIO and get their permanent URLs
      const photoUrl = await storageService.uploadToMinio(
        req.files["applicant_photo"][0],
      );
      const signatureUrl = await storageService.uploadToMinio(
        req.files["applicant_signature"][0],
      );

      // 4. Attach the file data to the payload for the Service layer
      validatedData.files = [
        { file_type: "PHOTO", minio_url: photoUrl },
        { file_type: "SIGNATURE", minio_url: signatureUrl },
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

      // 5. Handle unexpected Server Errors (HTTP 500)
      console.error("Error in createApplicant controller:", error);
      return res.status(500).json({
        success: false,
        message:
          "An internal server error occurred while processing the application.",
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
