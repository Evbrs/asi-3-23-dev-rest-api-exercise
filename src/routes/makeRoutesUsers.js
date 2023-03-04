import UserModel from "../db/models/UserModel.js"
import mw from "../middlewares/mw.js"
import validate from "../middlewares/validate.js"
import auth from "../middlewares/auth.js"
import { sanitizeUser } from "../sanitizers.js"
import { NotFoundError } from "../errors.js"
import hashPassword from "../hashPassword.js"
import {
  idValidator,
  nameValidator,
  emailValidator,
  firstNameValidator,
  lastNameValidator,
  passwordValidator,
  queryLimitValidator,
  queryOffsetValidator,
} from "../validators.js"
import config from "../config.js"
import RoleModel from "../db/models/RoleModel.js"

const makeRoutesUsers = ({ app, db }) => {
  const checkIfUserExists = async (userId) => {
    const user = await UserModel.query().findById(userId)

    if (user) {
      return user
    }

    throw new NotFoundError()
  }

  app.get(
    "/users",
    auth({ resources: "users" }),
    validate({
      query: {
        limit: queryLimitValidator,
        offset: queryOffsetValidator,
      },
    }),
    mw(async (req, res) => {
      const {
        limit = config.pagination.limit.default,
        offset = config.pagination.offset.default,
      } = req.data.query
      const users = await UserModel.query()
        .withGraphFetched("role")
        .limit(limit)
        .offset(offset)
      res.send({ data: sanitizeUser(users) })
    })
  )

  app.get(
    "/users/:userId",
    validate({
      params: { userId: idValidator.required() },
    }),
    auth({ resources: "users", canBeConsultedBySelf: true }),
    mw(async (req, res) => {
      const { userId } = req.data.params
      const user = await UserModel.query().findById(userId)

      if (!user) {
        throw new NotFoundError()
      }

      res.send({ data: sanitizeUser(user) })
    })
  )

  app.post(
    "/create-user",
    validate({
      body: {
        firstName: firstNameValidator.required(),
        lastName: lastNameValidator.required(),
        email: emailValidator.required(),
        password: passwordValidator.required(),
      },
    }),
    auth({ resources: "users" }),
    mw(async (req, res) => {
      const {
        firstName,
        lastName,
        email,
        password,
        roleName = "editor",
      } = req.data.body
      const [passwordHash, passwordSalt] = hashPassword(password)

      const [role] = await RoleModel.query()
        .select("id")
        .where("name", roleName)

      const [user] = await db("users")
        .insert({
          firstName,
          lastName,
          email,
          passwordHash,
          passwordSalt,
          roleId: parseInt(role.id),
        })
        .returning("*")

      res.send({ result: sanitizeUser(user) })
    })
  )

  app.patch(
    "/users/:userId",
    auth({ resources: "users", canBeConsultedBySelf: true }),
    validate({
      params: { userId: idValidator.required() },
      body: {
        firstName: nameValidator,
        lastName: nameValidator,
        email: emailValidator,
      },
    }),
    mw(async (req, res) => {
      const {
        data: {
          body: { firstName, lastName, email },
          params: { userId },
        }
      } = req

      const user = await checkIfUserExists(userId, res)

      if (!user) {
        return
      }

      const updatedUser = await UserModel.query().updateAndFetchById(userId, {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(email ? { email } : {}),
      })

      res.send({ data: sanitizeUser(updatedUser) })
    })
  )
  app.delete(
    "/users/:userId",
    auth({ resources: "users" }),
    validate({
      params: { userId: idValidator.required() },
    }),
    mw(async (req, res) => {
      const { userId } = req.data.params
      const user = await checkIfUserExists(userId, res)

      if (!user) {
        return
      }

      await UserModel.query().deleteById(userId)

      res.send({ data: sanitizeUser(user) })
    })
  )
}

export default makeRoutesUsers
