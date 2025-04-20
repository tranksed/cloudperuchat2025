
import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([

      queryInterface.addColumn("QuickMessages", "isCategory", {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }),

      queryInterface.addColumn("QuickMessages", "categoryId", {
        type: DataTypes.INTEGER,
        allowNull: true,
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("QuickMessages", "isCategory"),
      queryInterface.removeColumn("QuickMessages", "categoryId")
    ]);
  }
};
