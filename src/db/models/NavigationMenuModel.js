import BaseModel from "./BaseModel.js"
import PageModel from "./PageModel.js"

class NavigationMenuModel extends BaseModel {
  static tableName = "navigationMenus"

  static get relationMappings() {
    return {
      pages: {
        modelClass: PageModel,
        relation: BaseModel.HasManyRelation,
        join: {
          from: "navigationMenus.id",
          to: "pages.navigationMenuId",
        },
      },
    }
  }
}

export default NavigationMenuModel
