import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Region = sequelize.define(
  "Region",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Prevents duplicate regions like adding "Tatibandh" twice
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // If false, it hides from the frontend dropdown
    },
  },
  { tableName: "regions", timestamps: true },
);

export default Region;
