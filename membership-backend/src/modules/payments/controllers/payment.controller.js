import paymentService from "../services/payment.service.js";

class PaymentController {
  async createOrder(req, res) {
    try {
      const { applicant_id } = req.body;
      if (!applicant_id) {
        return res
          .status(400)
          .json({ success: false, message: "Applicant ID is required." });
      }

      const orderData = await paymentService.createPaymentOrder(applicant_id);
      return res.status(200).json({ success: true, data: orderData });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Error creating order",
      });
    }
  }

  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Missing payment verification details.",
        });
      }

      const result = await paymentService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );

      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Payment verification failed",
      });
    }
  }
}

export default new PaymentController();
