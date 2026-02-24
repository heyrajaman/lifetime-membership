import Joi from "joi";

const createApplicantDto = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required(),

  father_or_husband_name: Joi.string().trim().min(2).max(100).required(),

  permanent_address: Joi.string().trim().min(10).max(500).required(),

  current_address: Joi.string().trim().min(10).max(500).required(),

  // Indian mobile number validation (must start with 6–9)
  mobile_number: Joi.string()
    .pattern(/^[6-9][0-9]{9}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Mobile number must be a valid 10-digit Indian number.",
    }),

  email: Joi.string().email().trim().required(),

  education: Joi.string().trim().max(100).required(),

  occupation: Joi.string().trim().max(100).required(),

  // Optional field
  office_address: Joi.string().trim().max(500).optional().allow(null, ""),

  // ISO date format required
  date_of_birth: Joi.date().iso().required(),

  // Optional ISO date
  marriage_date: Joi.date().iso().optional().allow(null),

  blood_group: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional()
    .allow(null),

  membership_type: Joi.string().valid("LIFETIME").required(),

  // UUID v4 validation recommended
  proposer_member_id: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export default createApplicantDto;
