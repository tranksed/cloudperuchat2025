import Contact from "../../models/Contact";
import Tag from "../../models/Tag";

type Param = {
    companyId: number
  };

const FindAllContactService = async ({
    companyId
  }: Param): Promise<Contact[]> => {
    let where: any = {
        companyId
      };
  const contacts = await Contact.findAll({
    where,
    order: [["name", "ASC"]],
    include:[
      {model: Tag, as: "tags", attributes: ["id", "name", "color"]}
    ]
  });
  return contacts;
};

export default FindAllContactService;