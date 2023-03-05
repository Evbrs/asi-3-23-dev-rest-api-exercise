export const up = async (knex) => {
  await knex.schema.createTable("pages", (table) => {
    table.increments("id")
    table.text("title").unique().notNullable()
    table.text("content").notNullable()
    table.text("slug").notNullable()
    table.integer("creatorId").references("id").inTable("users").notNullable()
    table.json("modifiersIds").defaultTo("[]")
    table.date("publishedAt")
    table.boolean("published").notNullable().defaultTo(false)
  })

  await knex.schema.createTable("navigationMenus", (table) => {
    table.increments("id")
    table.text("name").notNullable()
    table.json("pagesId").defaultTo("{}")
  })
}

export const down = async (knex) => {
  await knex.schema.alterTable("pages", (table) => {
    table.dropUnique("title")
  })
  await knex.schema.dropTable("navigationMenus")
  await knex.schema.dropTable("pages")
}
