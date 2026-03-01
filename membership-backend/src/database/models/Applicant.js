import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Applicant = sequelize.define(
  "Applicant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    registration_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // It will be null until the Admin assigns it
    },
    full_name: { type: DataTypes.STRING, allowNull: false },
    gender: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
      allowNull: false,
    },
    aadhar_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    father_or_husband_name: { type: DataTypes.STRING, allowNull: false },
    permanent_address: { type: DataTypes.TEXT, allowNull: false },
    current_address: { type: DataTypes.TEXT, allowNull: false },
    mobile_number: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    education: { type: DataTypes.STRING, allowNull: false },
    occupation: { type: DataTypes.STRING, allowNull: false },
    office_address: { type: DataTypes.TEXT },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: false },
    marriage_date: { type: DataTypes.DATEONLY },
    blood_group: { type: DataTypes.STRING(10) },
    membership_type: {
      type: DataTypes.ENUM("LIFETIME"),
      defaultValue: "LIFETIME",
    },
    status: {
      type: DataTypes.ENUM(
        "PENDING_MEMBER_APPROVAL",
        "REJECTED_BY_MEMBER",
        "PENDING_ADMIN_REVIEW",
        "REJECTED_BY_ADMIN",
        "PENDING_PRESIDENT_APPROVAL",
        "REJECTED_BY_PRESIDENT",
        "PAYMENT_PENDING",
        "PAYMENT_COMPLETED",
        "MEMBER",
      ),
      defaultValue: "PENDING_MEMBER_APPROVAL",
    },
  },
  { tableName: "applicants", timestamps: true },
);

export default Applicant;
