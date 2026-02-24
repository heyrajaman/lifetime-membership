import express from "express";
import approvalController from "../controllers/approval.controller.js";

const router = express.Router();

router.get(
  "/verify/:token",
  approvalController.verifyTokenAndGetDetails.bind(approvalController),
);

// The frontend will call these via POST requests when the user clicks the email link and presses "Approve" or "Reject"
router.post(
  "/member",
  approvalController.handleMemberApproval.bind(approvalController),
);
router.post(
  "/president",
  approvalController.handlePresidentApproval.bind(approvalController),
);

export default router;
