import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("CompaniesSettings", "asaas", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("CompaniesSettings", "tokenixc", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("CompaniesSettings", "ipixc", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("CompaniesSettings", "ipmkauth", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("CompaniesSettings", "clientidmkauth", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("CompaniesSettings", "clientsecretmkauth", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("CompaniesSettings", "asaas"),
      queryInterface.removeColumn("CompaniesSettings", "tokenixc"),
      queryInterface.removeColumn("CompaniesSettings", "ipixc"),
      queryInterface.removeColumn("CompaniesSettings", "ipmkauth"),
      queryInterface.removeColumn("CompaniesSettings", "clientidmkauth"),
      queryInterface.removeColumn("CompaniesSettings", "clientsecretmkauth")
    ]);
  }
};
