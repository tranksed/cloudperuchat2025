import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.changeColumn("TicketTraking", "lastMessage", {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.changeColumn("TicketTraking", "lastMessage", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      })
    ]);
  }
};
