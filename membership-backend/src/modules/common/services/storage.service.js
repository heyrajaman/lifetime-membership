import { minioClient, MINIO_BUCKET_NAME } from "../../../config/minio.js";
import fs from "fs";

class StorageService {
  // Takes a Multer file object, uploads it to MinIO, and deletes the local copy
  async uploadToMinio(file) {
    if (!file) return null;

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const metaData = {
      "Content-Type": file.mimetype,
    };

    try {
      // 1. Upload the file from the local disk to MinIO
      await minioClient.fPutObject(
        MINIO_BUCKET_NAME,
        fileName,
        file.path,
        metaData,
      );

      // 2. Delete the temporary file from the local disk to free up space
      fs.unlinkSync(file.path);

      // 3. Return the exact path where the file can be retrieved
      return `/${MINIO_BUCKET_NAME}/${fileName}`;
    } catch (error) {
      console.error("MinIO Upload Error:", error);

      // Fallback: Ensure the local file is still deleted even if MinIO fails
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error("Failed to upload file to permanent storage.");
    }
  }
}

export default new StorageService();
