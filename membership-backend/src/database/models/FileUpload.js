import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const FileUpload = sequelize.define(
  "FileUpload",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    file_type: {
      type: DataTypes.ENUM(
        "PHOTO",
        "SIGNATURE",
        "PAYMENT_SLIP",
        "AADHAR_FRONT",
        "AADHAR_BACK",
      ),
      allowNull: false,
    },
    minio_url: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "file_uploads", timestamps: true },
);

export default FileUpload;
