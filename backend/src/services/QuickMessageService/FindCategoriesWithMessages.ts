import { Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";
import Company from "../../models/Company";

type Params = {
  companyId: string;
  userId: string;
  showAll: string;
};


export const FindCategoriesWithMessages = async ({ companyId, userId }: Params): Promise<any[]> => {
  const categories: QuickMessage[] = await QuickMessage.findAll({
    where: {
      companyId,
      // userId,
    },
  });

  // Converter instâncias do Sequelize para objetos JS puros
  const plainCategories = categories.map(item => item.get());

  const organizedCategories = organizeCategoriesAndMessages(plainCategories);

  return organizedCategories;
};

const organizeCategoriesAndMessages = (data: any[]) => {
  // Separar categorias (isCategory = true) e mensagens (isCategory = false)
  const categories = data.filter(item => item.isCategory === true);
  const messages = data.filter(item => item.isCategory === false);

  // Criar um novo objeto de categorias com suas mensagens associadas
  const result = categories.map(category => {
    return {
      ...category,
      messages: messages.filter(message => message.categoryId === category.id)
    };
  });

  return result;
};


