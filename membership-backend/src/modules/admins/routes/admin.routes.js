import express from "express";
import adminController from "../controllers/admin.controller.js";
import { verifyAdmin } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", adminController.login.bind(adminController));

// Admin Settings: Get and Update Fee
router.get(
  "/settings",
  verifyAdmin,
  adminController.getSettings.bind(adminController),
);

// Admin: Edit applicant text details
router.put(
  "/applicants/:id/edit",
  verifyAdmin,
  adminController.editApplicant.bind(adminController),
);

// Admin: Approve or Reject the application
router.post(
  "/applicants/:id/review",
  verifyAdmin,
  adminController.reviewApplicant.bind(adminController),
);

router.get("/members", adminController.getProposers.bind(adminController));
// Admin: Get full list of members for management grid
router.get(
  "/all-members",
  verifyAdmin,
  adminController.getAllMembersAdmin.bind(adminController),
);

router.post(
  "/promote",
  verifyAdmin,
  adminController.promoteApplicant.bind(adminController),
);
router.patch(
  "/settings/update-fee",
  verifyAdmin,
  adminController.updateFee.bind(adminController),
);

router.get(
  "/members/:id/id-card",
  verifyAdmin,
  adminController.downloadIdCard.bind(adminController),
);

// Admin: Toggle a member's active/inactive status
router.patch(
  "/members/:id/status",
  verifyAdmin,
  adminController.toggleMemberStatus.bind(adminController),
);

export default router;
