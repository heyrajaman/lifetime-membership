import jwt from "jsonwebtoken";
import "../config/env.js";

export const verifyAdmin = (req, res, next) => {
  try {
    // Check if the Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Access Denied. No token provided." });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token cryptographically
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the admin's ID to the request object for downstream use
    req.admin = decoded;

    // Pass control to the next middleware or controller
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid or expired token." });
  }
};
