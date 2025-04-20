import { Op, literal, fn, col } from "sequelize";
import Tag from "../../models/Tag";
import ContactTag from "../../models/ContactTag";
import TicketTag from "../../models/TicketTag";
interface Request {
  companyId: number;
  searchParam?: string;
  offset?: number;
  kanban?: number;
}

interface Response {
  tags: Tag[];
  hasMore: boolean;
}

const ListService = async ({
  companyId,
  searchParam,
  offset = 1,
  kanban = 0,
  offset: number,
}: Request): Promise<Response> => {
  let whereCondition = {};

  if ( Number(kanban) === 0 ) {
      if (searchParam) {
        whereCondition = {
          [Op.or]: [
            { name: { [Op.like]: `%${searchParam}%` } },
            { color: { [Op.like]: `%${searchParam}%` } }
            // { kanban: { [Op.like]: `%${searchParam}%` } }
          ]
        };
      }
      const limit = 20;
     // const offset = limit * (+pageNumber - 1);

     const  tags  = await Tag.findAll({
      where: { ...whereCondition, companyId, kanban },
      limit,
      offset,
      order: [["name", "ASC"]],
      subQuery: false,
      include: [
        { model: ContactTag,
          as: "contactTags",
          attributes: [],
          required: false
        },
      ],
      attributes: [
        'id',
        'name',
        'color',
        [fn('count', col('contactTags.tagId')), 'contactsCount']
      ],
      group:
        [ "Tag.id" ]
    });

    const hasMore = tags.length > limit;

    return {
      tags,
      hasMore
    };

  } else {
    if (searchParam) {
      whereCondition = {
        [Op.or]: [
          { name: { [Op.like]: `%${searchParam}%` } },
          { color: { [Op.like]: `%${searchParam}%` } }
          // { kanban: { [Op.like]: `%${searchParam}%` } }
        ]
      };
    }
    const limit = 20;

    const  tags  = await Tag.findAll({
      where: { ...whereCondition, companyId, kanban },
      limit,
      offset,
      order: [["name", "ASC"]],
      subQuery: false,
      include: [
        { model: TicketTag,
          as: "ticketTags",
          attributes: [],
          required: false

        },
      ],
      attributes: [
        'id',
        'name',
        'color',
        [fn('count', col('ticketTags.tagId')), 'ticketsCount']
      ],
      group:
        [ "Tag.id"]
    });

    const hasMore = tags.length > limit;

    return {
      tags,
      hasMore
    };
  }
};

export default ListService;
