import adminService from "../services/admin.service.js";
import { adminLoginDto } from "../dtos/admin.dto.js";

class AdminController {
  async login(req, res) {
    try {
      const validatedData = await adminLoginDto.validateAsync(req.body);

      const result = await adminService.login(
        validatedData.phone_number,
        validatedData.password,
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error.isJoi)
        return res
          .status(400)
          .json({ success: false, message: error.details[0].message });
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
