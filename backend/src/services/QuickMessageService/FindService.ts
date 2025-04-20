import { Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";
import Company from "../../models/Company";
import User from "../../models/User";

type Params = {
  companyId: string;
  userId: string;
  showAll: string;
};

const FindService = async ({ companyId, userId, showAll }: Params): Promise<QuickMessage[]> => {
  const userProfile = (await User.findByPk(userId))?.profile;

  let notes: QuickMessage[];
  if (userProfile !== "admin") {
    notes = await QuickMessage.findAll({
      where: {
        companyId,
        [Op.or]: [
          { geral: true },      // Mensagens globais
          { userId, geral: false } // Mensagens não globais criadas pelo usuário
        ],
        ...(showAll === "true" ? {} : { isCategory: false })
      },
      include: [{ model: Company, as: "company", attributes: ["id", "name"] }],
      order: [["shortcode", "ASC"]]
    });
  } else {
    notes = await QuickMessage.findAll({
      where: {
        companyId,
        ...(showAll === "true" ? {} : { isCategory: false })
      },
      include: [{ model: Company, as: "company", attributes: ["id", "name"] }],
      order: [["shortcode", "ASC"]]
    });
  }

  return notes;
};

export default FindService;
