import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Admin } from "../../../database/index.js";
import "../../../config/env.js";

class AdminService {
  async login(phone_number, password) {
    // 1. Find the admin by phone number
    const admin = await Admin.findOne({ where: { phone_number } });
    if (!admin) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    // 2. Verify the hashed password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Invalid phone number or password." };
    }

    // 3. Generate the JWT token
    const token = jwt.sign(
      { id: admin.id, phone_number: admin.phone_number, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    return {
      token,
      admin: { id: admin.id, phone_number: admin.phone_number },
    };
  }
}

export default new AdminService();
