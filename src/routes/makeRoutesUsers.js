import UserModel from "../db/models/UserModel.js"
import mw from "../middlewares/mw.js"
import validate from "../middlewares/validate.js"
import auth from "../middlewares/auth.js"
import { sanitizeUser } from "../sanitizers.js"
import { InvalidAccessError, NotFoundError } from "../errors.js"
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
        offset = config.pagination.limit.default,
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
    auth({ resources: "users" }),
    validate({
      params: { userId: idValidator.required() },
    }),
    mw(async (req, res) => {
      const { userId } = req.data.params
      const user = await UserModel.query().findById(userId)

      if (!user) {
        return
      }

      res.send({ data: sanitizeUser(user) })
    })
  )

  app.post(
    "/create-user",
    auth({ resources: "users" }),
    validate({
      body: {
        firstName: firstNameValidator.required(),
        lastName: lastNameValidator.required(),
        email: emailValidator.required(),
        password: passwordValidator.required(),
      },
    }),
    mw(async (req, res) => {
      const { firstName, lastName, email, password } = req.data.body
      const [passwordHash, passwordSalt] = hashPassword(password)
      const [user] = await db("users")
        .insert({
          firstName,
          lastName,
          email,
          passwordHash,
          passwordSalt,
          roleId: 3,
        })
        .returning("*")

      res.send({ result: sanitizeUser(user) })
    })
  )

  app.patch(
    "/users/:userId",
    auth({ resources: "users" }),
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
        },
        session: { user: sessionUser },
      } = req

      if (userId !== sessionUser.id) {
        throw new InvalidAccessError()
      }

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
