import { Request, Response } from 'express'
import Plantao from '../models/Plantao';
import { PlantaoData } from '../services/PlantaoServices/PlantaoInterfaces';
import { CreatePlantaoService } from '../services/PlantaoServices/CreatePlantaoService';


export const index = async (req: Request, res: Response): Promise<Response> => {

  const { companyId } = req.user;

  const plantao = await Plantao.findAll({
    include: ['user'],
    where: {
      companyId
    }
  });

  return res.json(plantao);

}

export const store = async (req: Request, res: Response): Promise<Response> => {

  const plantaoData: PlantaoData = req.body;
  const { companyId } = req.user;

  const response = await CreatePlantaoService({ plantaoData, companyId });

  return res.status(201).json(response);

}

export const show = async (req: Request, res: Response): Promise<Response> => {

  const { id } = req.params;

  const plantao = await Plantao.findOne({
    where: {
      id
    },
    include: ['user']
  });

  return res.status(200).json(plantao);

}

export const update = async (req: Request, res: Response): Promise<Response> => {

  const { id } = req.params;
  const data: PlantaoData = req.body;

  const plantao = await Plantao.findByPk(id);

  if (!plantao) {
    return res.status(404).json({ message: 'Plantão não encontrado' });
  }

  const response = await plantao.update(data);

  return res.status(200).json(response);

}

export const remove = async (req: Request, res: Response): Promise<Response> => {

  const { id } = req.params;

  const plantao = await Plantao.findByPk(id);

  if (!plantao) {
    return res.status(404).json({ message: 'Plantão não encontrado' });
  }

  await plantao.destroy();

  return res.status(200).json({ message: 'deleted' });

}
