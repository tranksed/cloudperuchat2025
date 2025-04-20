import express from "express";
import isAuth from "../middleware/isAuth";

import * as DashboardController from "../controllers/DashbardController";

const routes = express.Router();

routes.get("/dashboard", isAuth, DashboardController.index);
routes.get("/dashboard/total-atendimentos", isAuth, DashboardController.totalAtendimentos);
routes.get("/dashboard/ticketsUsers", isAuth, DashboardController.reportsUsers);
routes.get("/dashboard/queues", isAuth, DashboardController.reportsQueues);
routes.get("/dashboard/ticketsDay", isAuth, DashboardController.reportsDay);
routes.get("/dashboard/moments", isAuth, DashboardController.DashTicketsQueues);
routes.get("/dashboard/atendimentos-encerrados", isAuth, DashboardController.contagemAtendimetnosFinalizados);
routes.get("/dashboard/user-info", isAuth, DashboardController.userInformations)
routes.get("/dashboard/nps-info", isAuth, DashboardController.npsInformations)

export default routes;
