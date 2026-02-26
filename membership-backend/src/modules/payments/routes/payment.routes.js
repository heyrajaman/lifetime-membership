import express from "express";
import paymentController from "../controllers/payment.controller.js";

const router = express.Router();

router.get("/fee", paymentController.getFee.bind(paymentController));

// Route to create an order (Frontend calls this before opening Razorpay checkout)
router.post(
  "/create-order",
  paymentController.createOrder.bind(paymentController),
);

// Route to verify an order (Frontend calls this after Razorpay checkout succeeds)
router.post("/verify", paymentController.verifyPayment.bind(paymentController));

router.get("/status/:applicant_id", paymentController.checkStatus);
export default router;
