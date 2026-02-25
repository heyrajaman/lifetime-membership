import express from "express";
import adminController from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/login", adminController.login.bind(adminController));

router.get("/members", adminController.getProposers.bind(adminController));

export default router;
