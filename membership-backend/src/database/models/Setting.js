import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Setting = sequelize.define(
  "Setting",
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { tableName: "settings", timestamps: true },
);

export default Setting;
