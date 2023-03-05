import mw from "../middlewares/mw.js"
import validate from "../middlewares/validate.js"
import PageModel from "../db/models/PageModel.js"
import config from "../config.js"
import { NotFoundError } from "../errors.js"
import { sanitizePage } from "../sanitizers.js"
import {
  idValidator,
  titleValidator,
  contentValidator,
  queryLimitValidator,
  queryOffsetValidator,
} from "../validators.js"
import auth from "../middlewares/auth.js"

const makeRoutesPages = ({ app, db }) => {
  const checkIfPageExists = async (pageId) => {
    const page = await PageModel.query().findById(pageId)

    if (page) {
      return page
    }

    throw new NotFoundError()
  }

  app.get(
    "/pages/draft",
    validate({
      query: {
        limit: queryLimitValidator,
        offset: queryOffsetValidator,
      },
    }),
    auth({ resources: "pages" }),
    mw(async (req, res) => {
      const {
        limit = config.pagination.limit.default,
        offset = config.pagination.offset.default,
        sort = "id",
      } = req.data.query

      const pages = await PageModel.query()
        .where("published", false)
        .orderBy(sort)
        .limit(limit)
        .offset(offset)

      res.send({ data: sanitizePage(pages) })
    })
  )

  app.get(
    "/pages/published",
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

      const pages = await PageModel.query()
        .where("published", true)
        .orderBy(sort)
        .limit(limit)
        .offset(offset)

      res.send({ data: sanitizePage(pages) })
    })
  )

  app.get(
    "/pages/:pageId",
    validate({
      params: { pageId: idValidator.required() },
    }),
    mw(async (req, res) => {
      const { pageId } = req.data.params
      const page = await PageModel.query()
        .findById(pageId)
        .where("published", true)

      if (!page) {
        throw new NotFoundError()
      }

      res.send({ data: sanitizePage(page) })
    })
  )

  app.post(
    "/pages",
    validate({
      body: {
        title: titleValidator.required(),
        content: contentValidator.required(),
      },
    }),
    auth({ resources: "pages" }),
    mw(async (req, res) => {
      const { title, content, published = false } = req.data.body

      const publishedAt = published ? new Date() : null
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50)
      const creatorId = req.session.user.id

      const [page] = await db("pages")
        .insert({
          title,
          content,
          published,
          slug,
          creatorId,
          publishedAt,
        })
        .returning("*")

      res.send({ result: sanitizePage(page) })
    })
  )

  app.patch(
    "/pages/:pageId",
    validate({
      params: { pageId: idValidator.required() },
      body: {
        title: titleValidator,
        content: contentValidator,
      },
    }),
    auth({ resources: "pages" }),
    mw(async (req, res) => {
      const {
        data: {
          body: { title, content },
          params: { pageId },
        },
      } = req

      const page = await checkIfPageExists(pageId, res)
      const modifiersIds = [...page.modifiersIds, req.session.user.id]

      if (!page) {
        return
      }

      const updatedPage = await PageModel.query().updateAndFetchById(pageId, {
        ...(title ? { title } : {}),
        ...(content ? { content } : {}),
        ...(modifiersIds ? { modifiersIds: JSON.stringify(modifiersIds) } : {}),
      })

      res.send({ data: sanitizePage(updatedPage) })
    })
  )

  app.delete(
    "/pages/:pageId",
    validate({
      params: { pageId: idValidator.required() },
    }),
    auth({ resources: "pages" }),
    mw(async (req, res) => {
      const { pageId } = req.data.params
      const page = await checkIfPageExists(pageId, res)

      if (!page) {
        return
      }

      await PageModel.query().deleteById(pageId)

      res.send({ data: sanitizePage(page) })
    })
  )
}

export default makeRoutesPages
