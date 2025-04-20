import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("CompaniesSettings", "sendMessageOutExpedientTicketOpen", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "enabled"
      }),
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("CompaniesSettings", "sendMessageOutExpedientTicketOpen"),
    ]);
  }
};
