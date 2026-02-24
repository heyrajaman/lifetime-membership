import { Sequelize } from "sequelize";
import "./env.js";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
);

const testDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
};

export { sequelize, testDbConnection };
