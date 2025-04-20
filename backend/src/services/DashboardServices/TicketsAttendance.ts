import sequelize from "../../database/index";
import { QueryTypes } from "sequelize";

interface Return {

  data: {};

}

interface Request {
  initialDate: string;
  finalDate: string;
  companyId: string | number;

}

interface DataReturn {
  quantidade: number;
  data?: number;
  nome?: string;
}

interface dataUser {
  name: string;
}


export const TicketsAttendance = async ({ initialDate, finalDate, companyId }: Request): Promise<Return> => {

  const sqlUsers = `SELECT "Users".name FROM "Users" WHERE "Users"."companyId" = ${companyId}`

  const users: dataUser[] = await sequelize.query(sqlUsers, { type: QueryTypes.SELECT });

  const sql = `
    SELECT COUNT(*) AS quantidade,
    MIN(DATE("TicketTraking"."createdAt")) AS DATA,
    "Users".name AS nome
    FROM "TicketTraking"
    INNER JOIN "Users" ON ("TicketTraking"."userId" = "Users".id)
    inner JOIN "Tickets" ON ("Tickets".id = "TicketTraking"."ticketId")

    WHERE DATE("TicketTraking"."createdAt") >= '${initialDate}'
    AND DATE("TicketTraking"."createdAt") <= '${finalDate}'

    AND "Tickets"."isGroup" = false
    AND "TicketTraking"."companyId" = ${companyId}

    -- AND "TicketTraking"."finishedAt" is NOT null

    GROUP BY "Users".name
    ORDER BY nome ASC;

  `


  const data: DataReturn[] = await sequelize.query(sql, { type: QueryTypes.SELECT });

  users.map(user => {
    let indexCreated = data.findIndex((item) => item.nome === user.name);

    if (indexCreated === -1) {
      data.push({ quantidade: 0, nome: user.name })
    }

  })

  return { data }; // RETORNOU OS DADOS QUE FOI  PEGAR NO BACKEND OU SEJA É UM SERVICE
}
