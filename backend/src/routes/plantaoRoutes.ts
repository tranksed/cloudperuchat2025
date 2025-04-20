import express from "express";
import isAuth from "../middleware/isAuth";
import * as PlantaoController from "../controllers/PlantaoController"
import planRoutes from "./planRoutes";

const PlantaoRoutes = express.Router();

PlantaoRoutes.get("/plantao", isAuth, PlantaoController.index);
PlantaoRoutes.post("/plantao", isAuth, PlantaoController.store);
PlantaoRoutes.get("/plantao/:id", isAuth, PlantaoController.show);
PlantaoRoutes.put("/plantao/:id", isAuth, PlantaoController.update);
planRoutes.delete("/plantao/:id", isAuth, PlantaoController.remove);

export default PlantaoRoutes;
