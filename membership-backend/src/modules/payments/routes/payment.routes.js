import express from "express";
import paymentController from "../controllers/payment.controller.js";

const router = express.Router();

// Route to create an order (Frontend calls this before opening Razorpay checkout)
router.post(
  "/create-order",
  paymentController.createOrder.bind(paymentController),
);

// Route to verify an order (Frontend calls this after Razorpay checkout succeeds)
router.post("/verify", paymentController.verifyPayment.bind(paymentController));

export default router;
