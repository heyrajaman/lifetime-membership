import express from "express";
import applicantRoutes from "../modules/applicants/routes/applicant.routes.js";
import approvalRoutes from "../modules/approvals/routes/approval.routes.js";
import paymentRoutes from "../modules/payments/routes/payment.routes.js";
import adminRoutes from "../modules/admins/routes/admin.routes.js";
import regionRoutes from "../modules/regions/routes/region.routes.js";

const router = express.Router();

router.use("/admins", adminRoutes);
router.use("/approvals", approvalRoutes);
router.use("/payments", paymentRoutes);

router.use("/applicants", applicantRoutes);
router.use("/regions", regionRoutes);
export default router;
