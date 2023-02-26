// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export const production = {
  client: process.env.DB_CLIENT,
  connection: {
    database: process.env.DB_CONNECTION_DATABASE,
    user: process.env.DB_CONNECTION_USER,
    password: process.env.DB_PASSWORD
  },
  migrations: {
    directory: "./src/db/migrations"
  }
}
