import joi from "joi";
import { generalField } from "../../middlewares/validation.middleware.js";
import { roleType } from "../../DB/models/user.model.js";

export const changeRoleSchema = joi.object({
    userId: generalField.id.required(),
    role: joi.string().valid(...Object.values(roleType)).required()
}).required();
