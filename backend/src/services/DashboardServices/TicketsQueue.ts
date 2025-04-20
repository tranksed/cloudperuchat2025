import { Filterable } from "sequelize";
import sequelize from "../../database/index";
import TicketTraking from "../../models/TicketTraking";
import { Sequelize } from "sequelize-typescript";
import Queue from "../../models/Queue";

interface Request {
  initialDate: string;
  finalDate: string;
  companyId: string | number;

}

export const TicketsQueue = async ({ initialDate, finalDate, companyId }: Request): Promise<TicketTraking[]> => {

  const whereConditions: Filterable['where'] = {
    companyId,
    createdAt: Sequelize.literal(`DATE("TicketTraking"."createdAt") >= '${initialDate}'
    AND DATE("TicketTraking"."createdAt") <= '${finalDate}'`),

  };

  const response = await TicketTraking.findAll({
    where: whereConditions,
    include: [
      { model: Queue, as: 'queue', attributes: ['name', 'id'] }
    ],
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('TicketTraking.id')), 'quantidade'],
      'queue.name'
    ],
    group: ['queue.name', 'queue.id']
  });

  //remove os dados da 1° posição do array pois vem a soma total aqui ... caso quiser utilizar só descomentar
  // e fazer o tratamento no front
  // response.shift();

  return response;

}
