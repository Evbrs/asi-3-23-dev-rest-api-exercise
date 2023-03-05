import mw from "../middlewares/mw.js"
import validate from "../middlewares/validate.js"
import NavigationMenuModel from "../db/models/NavigationMenuModel.js"
import config from "../config.js"
import { NotFoundError } from "../errors.js"
import { sanitizeNavigationMenu } from "../sanitizers.js"
import {
  idValidator,
  navigationMenuNameValidator,
  pagesValidator,
  queryLimitValidator,
  queryOffsetValidator,
} from "../validators.js"
import auth from "../middlewares/auth.js"

const makeRoutesNavigationMenus = ({ app, db }) => {
  const checkIfNavigationMenuExists = async (navigationMenuId) => {
    const NavigationMenu = await NavigationMenuModel.query().findById(
      navigationMenuId
    )

    if (NavigationMenu) {
      return NavigationMenu
    }

    throw new NotFoundError()
  }

  app.get(
    "/navigation-menus",
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
        sort = "id",
      } = req.data.query

      const navigationMenus = await NavigationMenuModel.query()
        .orderBy(sort)
        .limit(limit)
        .offset(offset)

      res.send({ data: sanitizeNavigationMenu(navigationMenus) })
    })
  )

  app.get(
    "/navigation-menus/:navigationMenuId",
    validate({
      params: { navigationMenuId: idValidator.required() },
    }),
    mw(async (req, res) => {
      const { navigationMenuId } = req.data.params
      const navigationMenu = await NavigationMenuModel.query().findById(
        navigationMenuId
      )

      if (!navigationMenu) {
        throw new NotFoundError()
      }

      res.send({ data: sanitizeNavigationMenu(navigationMenu) })
    })
  )

  app.post(
    "/navigation-menus",
    validate({
      body: {
        name: navigationMenuNameValidator.required(),
      },
    }),
    auth({ resources: "navigationMenu" }),
    mw(async (req, res) => {
      const { name } = req.data.body

      const [navigationMenu] = await db("navigationMenus")
        .insert({
          name,
        })
        .returning("*")

      res.send({ result: sanitizeNavigationMenu(navigationMenu) })
    })
  )

  app.patch(
    "/navigation-menus/:navigationMenuId",
    validate({
      params: { navigationMenuId: idValidator.required() },
      body: {
        name: navigationMenuNameValidator,
        pages: pagesValidator,
      },
    }),
    auth({ resources: "navigationMenu" }),
    mw(async (req, res) => {
      const {
        data: {
          body: { name, pages },
          params: { navigationMenuId },
        },
      } = req

      const navigationMenu = await checkIfNavigationMenuExists(navigationMenuId)
      const arrayWithNewPages = {
        ...navigationMenu.pages,
        ...pages,
      }

      if (!navigationMenu) {
        return
      }

      const updatedNavigationMenu =
        await NavigationMenuModel.query().updateAndFetchById(navigationMenuId, {
          ...(name ? { name } : {}),
          ...(pages ? { pages: arrayWithNewPages } : {}),
        })

      res.send({ data: sanitizeNavigationMenu(updatedNavigationMenu) })
    })
  )

  app.delete(
    "/navigation-menus/:navigationMenuId",
    validate({
      params: { navigationMenuId: idValidator.required() },
    }),
    auth({ resources: "navigationMenu" }),
    mw(async (req, res) => {
      const { navigationMenuId } = req.data.params
      const navigationMenu = await checkIfNavigationMenuExists(navigationMenuId)

      if (!navigationMenu) {
        return
      }

      await NavigationMenuModel.query().deleteById(navigationMenuId)

      res.send({ data: sanitizeNavigationMenu(navigationMenu) })
    })
  )
}

export default makeRoutesNavigationMenus
