import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone_number: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "admins", timestamps: true },
);

export default Admin;
