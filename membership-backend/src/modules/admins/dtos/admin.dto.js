import Joi from "joi";

export const adminLoginDto = Joi.object({
  phone_number: Joi.string()
    .trim()
    .pattern(/^[6-9][0-9]{9}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required.",
      "string.pattern.base":
        "Phone number must be a valid 10-digit Indian mobile number.",
      "any.required": "Phone number is required.",
    }),

  password: Joi.string()
    .trim()
    .min(8)
    .max(16)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/,
    )
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must not exceed 16 characters.",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "any.required": "Password is required.",
    }),
});
