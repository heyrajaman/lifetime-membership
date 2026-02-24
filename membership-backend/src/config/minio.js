import * as Minio from "minio";
import "./env.js";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export const MINIO_BUCKET_NAME =
  process.env.MINIO_BUCKET_NAME || "maharashtra-mandal-uploads";

// This function creates the bucket automatically if it doesn't exist when the server starts
export const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(MINIO_BUCKET_NAME, "us-east-1");
      console.log(
        `✅ MinIO Bucket '${MINIO_BUCKET_NAME}' created successfully.`,
      );
    } else {
      console.log(`✅ MinIO Bucket '${MINIO_BUCKET_NAME}' is ready.`);
    }
  } catch (error) {
    console.error("❌ Error initializing MinIO:", error);
  }
};
