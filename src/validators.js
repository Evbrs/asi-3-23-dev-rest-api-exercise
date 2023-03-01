import * as yup from "yup"
import config from "./config.js"

export const nameValidator = yup
  .string()
  .matches(/^[\p{L} -]+$/u, "Name is invalid")
  .label("Name")

export const firstNameValidator = nameValidator.label("First name")

export const lastNameValidator = nameValidator.label("Last name")

export const emailValidator = yup.string().email().label("Email")

export const idValidator = yup
  .number()
  .integer()
  .min(1)
  .label("ID")
  .typeError("Invalid ID")

export const passwordValidator = yup
  .string()
  .matches(
    /^(?=.*[^\p{L}0-9])(?=.*[0-9])(?=.*\p{Lu})(?=.*\p{Ll}).{8,}$/u,
    "Password must be at least 8 chars & contain at least 1 lower case, 1 upper case, 1 digit and 1 special char."
  )
  .label("Password")

export const queryLimitValidator = yup
  .number()
  .integer()
  .min(config.pagination.limit.min)
  .default(config.pagination.limit.default)
  .label("Query Limit")

export const queryOffsetValidator = yup
  .number()
  .integer()
  .min(0)
  .label("Query Offset")
