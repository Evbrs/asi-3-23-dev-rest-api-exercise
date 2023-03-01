import UserModel from "../db/models/UserModel.js"
import { InvalidAccessError, NotFoundError } from "../errors.js"
import mw from "../middlewares/mw.js"
import validate from "../middlewares/validate.js"
import { sanitizeUser } from "../sanitizers.js"
import {
  idValidator,
  nameValidator,
  emailValidator,
  queryLimitValidator,
  queryOffsetValidator,
} from "../validators.js"
import config from "../config.js"

const makeRoutesUsers = ({ app }) => {
  const checkIfUserExists = async (userId) => {
    const user = await UserModel.query().findById(userId)

    if (user) {
      return user
    }

    throw new NotFoundError()
  }

  app.get(
    "/users",
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

  app.patch(
    "/users/:userId",
    // auth,
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
