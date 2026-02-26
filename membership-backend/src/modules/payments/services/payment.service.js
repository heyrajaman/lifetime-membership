import Razorpay from "razorpay";
import crypto from "crypto";
import {
  sequelize,
  Applicant,
  Payment,
  Setting,
} from "../../../database/index.js";
import "../../../config/env.js";

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  // 1. Creates a Razorpay Order when the frontend requests it
  async createPaymentOrder(applicantId) {
    const transaction = await sequelize.transaction();

    try {
      const feeSetting = await Setting.findByPk("LIFETIME_MEMBERSHIP_FEE", {
        transaction,
      });

      const currentFee = feeSetting ? parseInt(feeSetting.value) : 1510;

      const applicant = await Applicant.findByPk(applicantId, { transaction });

      if (!applicant) {
        throw { statusCode: 404, message: "Applicant not found." };
      }

      // STRICT BLOCK: If they already paid, completely block them.
      if (
        applicant.status === "PAYMENT_COMPLETED" ||
        applicant.status === "MEMBER"
      ) {
        throw {
          statusCode: 400,
          message:
            "Payment has already been successfully completed for this application.",
        };
      }

      // ALLOW RETRIES: They can only generate a payment link if they are in PAYMENT_PENDING
      if (applicant.status !== "PAYMENT_PENDING") {
        throw {
          statusCode: 400,
          message: `Applicant is not eligible for payment. Current status is ${applicant.status}.`,
        };
      }

      // Create order via Razorpay API (amount must be in paise, so multiply by 100)
      const options = {
        amount: currentFee * 100,
        currency: "INR",
        receipt: `receipt_app_${applicantId.substring(0, 8)}_${Date.now()}`,
      };

      const order = await this.razorpay.orders.create(options);

      // Save the new order details in our database
      await Payment.create(
        {
          applicant_id: applicantId,
          razorpay_order_id: order.id,
          amount: currentFee,
          status: "PENDING",
        },
        { transaction },
      );

      await transaction.commit();

      return {
        order_id: order.id,
        amount_in_paise: order.amount,
        amount_in_rupees: currentFee,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 2. Cryptographically verifies the payment after frontend checkout is done
  async verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  ) {
    const transaction = await sequelize.transaction();

    try {
      // Create the expected signature using our secret key
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        throw {
          statusCode: 400,
          message: "Invalid payment signature. Potential fraud detected.",
        };
      }

      // If authentic, update the database
      const paymentRecord = await Payment.findOne({
        where: { razorpay_order_id },
        transaction,
      });
      if (!paymentRecord) {
        throw { statusCode: 404, message: "Payment record not found." };
      }

      paymentRecord.status = "COMPLETED";
      await paymentRecord.save({ transaction });

      const applicant = await Applicant.findByPk(paymentRecord.applicant_id, {
        transaction,
      });
      applicant.status = "PAYMENT_COMPLETED";
      await applicant.save({ transaction });

      await transaction.commit();
      return {
        success: true,
        message: "Payment verified and application is fully completed.",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default new PaymentService();
