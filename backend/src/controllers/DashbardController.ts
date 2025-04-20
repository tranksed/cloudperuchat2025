import { Request, Response } from "express";
import DashboardDataService, { DashboardData, Params } from "../services/ReportService/DashbardDataService";
import { TicketsAttendance } from "../services/ReportService/TicketsAttendance";
import { TicketsDayService } from "../services/ReportService/TicketsDayService";
import TicketsQueuesService from "../services/TicketServices/TicketsQueuesService";
import TicketTraking from "../models/TicketTraking";
import { Op, QueryTypes } from "sequelize";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import sequelize from "../database";
import { TicketsQueue } from "../services/DashboardServices/TicketsQueue";

type IndexQuery = {
  initialDate: string;
  finalDate: string;
  companyId: number | any;
};

type IndexQueryPainel = {
  dateStart: string;
  dateEnd: string;
  status: string[];
  queuesIds: string[];
  showAll: string;
};
export const index = async (req: Request, res: Response): Promise<Response> => {
  const params: Params = req.query;
  const { companyId } = req.user;
  let daysInterval = 3;

  const dashboardData: DashboardData = await DashboardDataService(
    companyId,
    params
  );
  return res.status(200).json(dashboardData);
};

export const reportsUsers = async (req: Request, res: Response): Promise<Response> => {

  const { initialDate, finalDate } = req.query as IndexQuery
  const { companyId } = req.user;

  const { data } = await TicketsAttendance({ initialDate, finalDate, companyId });

  return res.json({ data });

}

export const reportsDay = async (req: Request, res: Response): Promise<Response> => {

  const { initialDate, finalDate, companyId } = req.query as IndexQuery

  const { count, data } = await TicketsDayService({ initialDate, finalDate, companyId });

  return res.json({ count, data });

}

export const DashTicketsQueues = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile, id: userId } = req.user;
  const { dateStart, dateEnd, status, queuesIds, showAll } = req.query as IndexQueryPainel;

  const tickets = await TicketsQueuesService({
    showAll: profile === "admin" ? showAll : false,
    dateStart,
    dateEnd,
    status,
    queuesIds,
    userId,
    companyId,
    profile
  });

  return res.status(200).json(tickets);
};


// Rota adicionada para a contagem de chats encerrados
export const contagemAtendimetnosFinalizados = async (req: Request, res: Response): Promise<Response> => {

  const { companyId } = req.user;

  const { initialDate, finalDate } = req.query as IndexQuery;

  // console.log("datas no backend => ", initialDate, finalDate)

  const result = await TicketTraking.count({
    where: {
      companyId: companyId,
      // disabledBot: true, // Não existe essa coluna no baco
      createdAt: {
        [Op.between]: [+startOfDay(parseISO(initialDate)), +endOfDay(parseISO(finalDate))]
        // [Op.between]: [initialDate, finalDate]
      }
    }
  });

  return res.json(result)

  /**
   *  "message": "startOfDay não esta definido ou seja , nao esta importado ...", erro aqui ...
   *
   * ctrl+spaco , importa a biblioteca, pronto
   * facil e rapido
   *
   * salva e testa de novo
   *
   * ouytro erro , olha no terminal , procura o erro
   *
   *  "message": "sintaxe de entrada ├® inv├ílida para tipo timestamp with time zone: \"Invalid date\"",
   *
   * formato da data ta invalido ...
   *
   * testa a data se ta chegando no carai do backend
   * como , a poha do console.log
   *
   * salva testa de novo
   *
   * datas nao chega no back, ou seja o problema nao é no back ....
   *
   * olha como ´pe simples debugar as coisas e entender os erros
   *
   * se as datas nao ta no back vamos conferir se ta sendo enviada pelo front
   *
   *
   *
   */

}

// Rota adicionada para exibir o atendente em destaque
export const userInformations = async (req: Request, res: Response): Promise<Response> => {

  const { companyId } = req.user;
  const { initialDate, finalDate } = req.query as IndexQuery; // esse indexquey é apenas uma tipagem de dado , como string, number , boolean etc ...

  const sql = `
  SELECT TT."userId",
    "Users"."name",
    COUNT(TT."userId") as quantidade
  FROM "TicketTraking" as TT
  inner join "Users" on "Users".id = TT."userId"
  WHERE TT."companyId" = ${companyId}
    AND TT."finishedAt" is not null
    AND TT."finishedAt" BETWEEN '${initialDate} 00:00:00' AND '${finalDate} 23:59:59'
  GROUP BY TT."userId", "Users"."name"
   ORDER BY quantidade DESC
  `

  const result = await sequelize.query(sql, { type: QueryTypes.SELECT })

  return res.json(result);
}

// Rota adicionada para a contagem de NPS no card da tela de atendentes
export const npsInformations = async (req: Request, res: Response): Promise<Response> => {

  const { companyId } = req.user;
  const { initialDate, finalDate } = req.query as IndexQuery; // esse indexquey é apenas uma tipagem de dado , como string, number , boolean etc ...

  const sql = `
   SELECT
    COUNT(*) AS total_notas,
    SUM(CASE WHEN rate >= 0 AND rate <= 1 THEN 1 ELSE 0 END) AS ruim,
    SUM(CASE WHEN rate > 1 AND rate <= 2 THEN 1 ELSE 0 END) AS media,
    SUM(CASE WHEN rate >= 3 AND rate <= 3 THEN 1 ELSE 0 END) AS boa
FROM
    "UserRatings"
   WHERE "UserRatings"."companyId" = ${companyId}
      AND "UserRatings"."updatedAt" BETWEEN '${initialDate} 00:00:00' AND '${finalDate} 23:59:59'
  `

  // console.log("SQL", sql) tira os capeta do console, depois que vc testar

  const result = await sequelize.query(sql, { type: QueryTypes.SELECT })

  // console.log(result)

  return res.json(result);
}

export const reportsQueues = async (req: Request, res: Response): Promise<Response> => {

  const { initialDate, finalDate } = req.query as IndexQuery
  const { companyId } = req.user;

  const reponse = await TicketsQueue({ initialDate, finalDate, companyId });

  return res.json(reponse);

}

export const totalAtendimentos = async (req: Request, res: Response): Promise<Response> => {

  const { initialDate, finalDate } = req.query as IndexQuery
  const { companyId } = req.user;

  const { count, data } = await TicketsDayService({ initialDate, finalDate, companyId });

  return res.json({ count, data });
}
