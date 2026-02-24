import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./config/env.js";

// Import Database & Master Router
import { testDbConnection } from "./config/database.js";
import { syncDatabase } from "./database/index.js";
import { initMinio } from "./config/minio.js";
import apiRoutes from "./routes/index.js";

const app = express();

// === GLOBAL MIDDLEWARES ===
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// === API ROUTES ===
// All routes are now cleanly prefixed with /api/v1 through the central router
app.use("/api/v1", apiRoutes);

// === GLOBAL ERROR HANDLER ===
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// === SERVER INITIALIZATION ===
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await testDbConnection();
    await syncDatabase();
    await initMinio();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
