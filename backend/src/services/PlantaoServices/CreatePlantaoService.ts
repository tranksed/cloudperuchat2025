import AppError from "../../errors/AppError";
import Plantao from "../../models/Plantao";
import { PlantaoData } from "./PlantaoInterfaces";

interface Request {
  plantaoData: PlantaoData;
  companyId: number;
}

export const CreatePlantaoService = async ({ plantaoData, companyId }: Request): Promise<Plantao> => {

  // nao deixar criar plantao com o mesmo usuario e empresa

  const plantaoExists = await Plantao.findOne({
    where: {
      userId: plantaoData.userId,
      companyId
    }
  })

  if (plantaoExists) {
    throw new AppError("Já existe um plantão cadastrado para este usuário");
  }

  const plantao = await Plantao.create({
    ...plantaoData,
    companyId: companyId
  });

  return plantao;

}
