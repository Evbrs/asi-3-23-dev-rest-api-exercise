import cors from "cors"
import express from "express"
import morgan from "morgan"

const server = async (config) => {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(morgan("dev"))

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
