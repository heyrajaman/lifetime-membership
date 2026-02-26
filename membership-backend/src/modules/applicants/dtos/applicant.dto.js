import Joi from "joi";

// Calculate the maximum allowed date of birth (Exactly 18 years ago from today)
const maxDob = new Date();
maxDob.setFullYear(maxDob.getFullYear() - 18);

// Verhoeff Algorithm Tables for Aadhar Validation
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// Custom Joi Validator Function for Aadhar using Verhoeff
const aadharValidator = (value, helpers) => {
  if (!/^\d{12}$/.test(value)) {
    return helpers.message("Aadhar number must be exactly 12 digits.");
  }

  let c = 0;
  let invertedArray = value.split("").reverse().map(Number);

  for (let i = 0; i < invertedArray.length; i++) {
    c = d[c][p[i % 8][invertedArray[i]]];
  }

  if (c !== 0) {
    return helpers.message(
      "Invalid Aadhar Number according to Verhoeff algorithm.",
    );
  }

  return value; // Validation passed
};

const createApplicantDto = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required(),

  // NEW: Gender field
  gender: Joi.string().valid("MALE", "FEMALE", "OTHER").required(),

  // NEW: Aadhar field with custom Verhoeff validator
  aadhar_number: Joi.string()
    .custom(aadharValidator, "Aadhar Verhoeff Validation")
    .required(),

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
