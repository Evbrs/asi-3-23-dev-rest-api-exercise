export const up = async (knex) => {
  await knex.schema.createTable("users", (table) => {
    table.increments("id")
    table.text("firstName").notNullable()
    table.text("lastName").notNullable()
    table.text("email").notNullable().unique()
    table.text("password").notNullable()
    table.text("jwtToken")
    table.integer("roleId").notNullable().references("id").inTable("roles")
  })
}

export const down = async (knex) => {
  await knex.schema.dropTable("users")
}