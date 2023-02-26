export const up = async (knex) => {
  await knex.schema.createTable("roles", (table) => {
    table.increments("id")
    table.enu("name", ["admin", "manager", "editor"]).notNullable().defaultTo("editor")
    table.text("permissions")
  })
}

export const down = async (knex) => {
  await knex.schema.dropTable("roles")
}