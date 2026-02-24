import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ApprovalToken = sequelize.define(
  "ApprovalToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: { type: DataTypes.STRING, unique: true, allowNull: false },
    role_required: {
      type: DataTypes.ENUM("MEMBER", "PRESIDENT"),
      allowNull: false,
    },
    is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "approval_tokens", timestamps: true },
);

export default ApprovalToken;
