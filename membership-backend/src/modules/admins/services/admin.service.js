import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Admin,Member } from "../../../database/index.js";
import "../../../config/env.js";
import { Op } from "sequelize";
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

  async getAllProposers(searchTerm = "") {
    const whereClause = { role: "MEMBER" };
   
    if (searchTerm) {
      whereClause.name = { 
        [Op.like]: `%${searchTerm}%` 
      };
    }

    const members = await Member.findAll({
      where: whereClause,
      attributes: ["id", "name"], 
      order: [["name", "ASC"]],
      limit: 10 // Only return the top 10 closest matches for performance
    });
    
    return members;
  }
}

export default new AdminService();
