import express from "express";
import applicantController from "../controllers/applicant.controller.js";
import { upload } from "../../../middlewares/upload.middleware.js";
import { verifyAdmin } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "applicant_photo", maxCount: 1 },
    { name: "applicant_signature", maxCount: 1 },
    { name: "aadhar_front", maxCount: 1 },
    { name: "aadhar_back", maxCount: 1 },
  ]),
  applicantController.createApplicant.bind(applicantController),
);

router.post(
  "/admin-submit",
  verifyAdmin,
  upload.fields([
    { name: "applicant_photo", maxCount: 1 },
    { name: "applicant_signature", maxCount: 1 },
    { name: "aadhar_front", maxCount: 1 },
    { name: "aadhar_back", maxCount: 1 },
  ]),
  applicantController.createApplicantByAdmin.bind(applicantController),
);

router.put(
  "/:id",
  upload.fields([
    { name: "applicant_photo", maxCount: 1 },
    { name: "applicant_signature", maxCount: 1 },
    { name: "aadhar_front", maxCount: 1 },
    { name: "aadhar_back", maxCount: 1 },
  ]),
  applicantController.resubmitApplicant.bind(applicantController),
);

router.get(
  "/",
  verifyAdmin,
  applicantController.getApplicants.bind(applicantController),
);
router.get(
  "/:id",
  applicantController.getApplicantById.bind(applicantController),
);

export default router;
