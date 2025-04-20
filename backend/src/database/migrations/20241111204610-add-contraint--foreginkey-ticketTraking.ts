module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('TicketTraking', 'TicketTraking_contactId_fkey');
    await queryInterface.sequelize.query('ALTER TABLE public."TicketTraking" ADD CONSTRAINT "TicketTraking_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contacts" (id) ON DELETE CASCADE ON UPDATE CASCADE;');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('TicketTraking', 'TicketTraking_contactId_fkey');
    await queryInterface.sequelize.query('ALTER TABLE public."TicketTraking" ADD CONSTRAINT "TicketTraking_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contacts" (id) ON DELETE CASCADE ON UPDATE CASCADE;');
  }
};
