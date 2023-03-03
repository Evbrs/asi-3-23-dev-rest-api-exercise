import jsonwebtoken from "jsonwebtoken"

import UserModel from "../db/models/UserModel.js"
import config from "../config.js"
import { InvalidSessionError, InvalidAccessError } from "../errors.js"
import mw from "./mw.js"

const auth = (perms) =>
  mw(async (req, res, next) => {
    const { authorization } = req.headers
    const { method } = req
    const { resources, canBeConsultedBySelf = false } = perms

    if (!authorization) {
      throw new InvalidSessionError()
    }

    try {
      const { payload } = jsonwebtoken.verify(
        authorization.slice(7),
        config.security.session.jwt.secret
      )
      req.session = payload

      const user = await UserModel.query()
        .findById(payload.user.id)
        .withGraphFetched("role")

      const permissions = JSON.parse(user.role.permissions)

      if (permissions[resources][method]) {
        next()

        return
      }

      if (!canBeConsultedBySelf) {
        throw new InvalidAccessError()
      }

      const { userId } = req.data.params

      if (resources !== "users" || payload.user.id !== userId) {
        throw new InvalidAccessError()
      }

      next()
    } catch (err) {
      if (err instanceof jsonwebtoken.JsonWebTokenError) {
        throw new InvalidSessionError()
      }

      throw err
    }
  })

export default auth
