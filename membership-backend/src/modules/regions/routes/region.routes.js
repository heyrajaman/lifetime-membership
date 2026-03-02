import { Router } from "express";
import regionController from "../controllers/region.controller.js";
import { verifyAdmin } from "../../../middlewares/auth.middleware.js"; // Adjust this path if your auth middleware is located elsewhere

const router = Router();

// ==========================================
// PUBLIC ROUTE (For the Frontend Application Form)
// ==========================================
// GET /api/v1/regions -> Returns only active regions for the dropdown
router.get("/", regionController.getActiveRegions.bind(regionController));

// ==========================================
// ADMIN ROUTES (Protected by verifyAdmin)
// ==========================================
// GET /api/v1/regions/admin -> Returns ALL regions (active & inactive)
router.get(
  "/admin",
  verifyAdmin,
  regionController.getAllRegionsForAdmin.bind(regionController),
);

// POST /api/v1/regions/admin -> Adds a new region
router.post(
  "/admin",
  verifyAdmin,
  regionController.createRegion.bind(regionController),
);

// PATCH /api/v1/regions/admin/:id/toggle -> Hides/Shows a region
router.patch(
  "/admin/:id/toggle",
  verifyAdmin,
  regionController.toggleRegionStatus.bind(regionController),
);

export default router;
