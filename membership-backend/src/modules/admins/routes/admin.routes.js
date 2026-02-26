import express from "express";
import adminController from "../controllers/admin.controller.js";
import { verifyAdmin } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", adminController.login.bind(adminController));

router.get("/members", adminController.getProposers.bind(adminController));

router.post(
  "/promote",
  verifyAdmin,
  adminController.promoteApplicant.bind(adminController),
);

router.get(
  "/members/:id/id-card",
  verifyAdmin,
  adminController.downloadIdCard.bind(adminController),
);

export default router;
