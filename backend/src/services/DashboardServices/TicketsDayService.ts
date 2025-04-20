import sequelize from "../../database/index";
import { QueryTypes } from "sequelize";
import { logger } from "../../utils/logger";

interface Request {
  initialDate: string;
  finalDate: string;
  companyId: string | number;
}

interface DataReturn {
  total: number;
  data?: number;
  horario?: string;
}

interface Return {

  data: {};
  count: number;

}

export const TicketsDayService = async ({ initialDate, finalDate, companyId }: Request): Promise<Return> => {

  let sql = '';
  let count = 0;

  if (initialDate && initialDate.trim() === finalDate && finalDate.trim()) {

    sql = `
      SELECT COUNT(*) AS total,
      EXTRACT(HOUR FROM "TicketTraking"."createdAt") AS horario
      FROM "TicketTraking"
      INNER JOIN "Tickets" ON ("Tickets".id = "TicketTraking"."ticketId")
      WHERE DATE("TicketTraking"."createdAt") >= '${initialDate}'
      AND DATE("TicketTraking"."createdAt") <= '${finalDate}'
      AND "TicketTraking"."companyId" = ${companyId}
      AND "Tickets"."isGroup" = FALSE
      GROUP BY EXTRACT(HOUR FROM "TicketTraking"."createdAt")
      ORDER BY horario ASC;
    `

  } else {

    sql = `
      SELECT COUNT(*) AS total,
      TO_CHAR("TicketTraking"."createdAt", 'DD/MM/YYYY') AS data
      FROM "TicketTraking"
      INNER JOIN "Tickets" ON ("Tickets".id = "TicketTraking"."ticketId")
      WHERE DATE("TicketTraking"."createdAt") >= '${initialDate}'
      AND  DATE("TicketTraking"."createdAt")  <= '${finalDate}'
      AND "Tickets"."isGroup" = FALSE
      AND "TicketTraking"."companyId" = ${companyId}
      GROUP BY TO_CHAR("TicketTraking"."createdAt", 'DD/MM/YYYY')
      ORDER BY data ASC;
    `

  }


  const data: DataReturn[] = await sequelize.query(sql, { type: QueryTypes.SELECT });


  data.forEach((register) => {
    count += Number(register.total);
  })


  return { data, count };

}
