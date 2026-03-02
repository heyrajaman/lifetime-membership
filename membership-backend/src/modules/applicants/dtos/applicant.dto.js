import Joi from "joi";

// Calculate the maximum allowed date of birth (Exactly 18 years ago from today)
const maxDob = new Date();
maxDob.setFullYear(maxDob.getFullYear() - 18);

const createApplicantDto = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required(),

  // NEW: Gender field
  gender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),

  father_or_husband_name: Joi.string().trim().min(2).max(100).required(),

  permanent_address: Joi.string().trim().min(10).max(500).required(),

  current_address: Joi.string().trim().min(10).max(500).required(),

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

  office_address: Joi.string().trim().max(500).optional().allow(null, ""),

  date_of_birth: Joi.date().iso().max(maxDob).required().messages({
    "date.max": "Applicant must be at least 18 years old to apply.",
  }),

  marriage_date: Joi.date().iso().optional().allow(null),

  blood_group: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .optional()
    .allow(null),

  membership_type: Joi.string().valid("LIFETIME").required(),

  proposer_member_id: Joi.string().uuid({ version: "uuidv4" }).required(),
});

export default createApplicantDto;
