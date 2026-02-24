import Joi from "joi";

export const processApprovalDto = Joi.object({
  token: Joi.string().hex().length(64).required(), // Our tokens are 32 random bytes in hex (64 chars)
  action: Joi.string().valid("APPROVE", "REJECT").required(),
});
