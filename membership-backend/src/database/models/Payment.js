import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    razorpay_order_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1510.0 },
    status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED"),
      defaultValue: "PENDING",
    },
  },
  { tableName: "payments", timestamps: true },
);

export default Payment;
