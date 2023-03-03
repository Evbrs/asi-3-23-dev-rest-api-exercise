import cors from "cors"
import knex from "knex"
import express from "express"
import morgan from "morgan"

import makeRoutesUsers from "./routes/makeRoutesUsers.js"
import makeRoutesSign from "./routes/makeRoutesSign.js"
import BaseModel from "./db/models/BaseModel.js"

const server = async (config) => {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(morgan("dev"))

  const db = knex(config.db)
  BaseModel.knex(db)

  makeRoutesUsers({ app, db })
  makeRoutesSign({ app, db })

  app.use((req, res) => {
    res
      .status(404)
      .send({ errCode: 404, errMessage: `Cannot ${req.method} ${req.url}` })
  })

  app.listen(config.port, () =>
    // eslint-disable-next-line no-console
    console.log(`Listening on port: ${config.port}`)
  )
}

export default server
