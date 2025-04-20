import { Chat, Contact } from "@whiskeysockets/baileys";
import Baileys from "../../models/Baileys";

interface Request {
  whatsappId: number;
  contacts?: Contact[];
  chats?: Chat[];
}

const createOrUpdateBaileysService = async ({
  whatsappId,
  contacts,
  chats
}: Request): Promise<Baileys> => {
  try {
    const baileysExists = await Baileys.findOne({
      where: { whatsappId }
    });

    if (baileysExists) {
      const getChats = baileysExists.chats
        ? JSON.parse(JSON.stringify(baileysExists.chats))
        : [];
      let getContacts = baileysExists.contacts
        ? JSON.parse(JSON.stringify(baileysExists.contacts))
        : [];

      if (chats) {
        getChats.push(...chats);
        getChats.sort();
        getChats.filter(
          (v: string, i: number, a: string) => a.indexOf(v) === i
        );
      }

      if (contacts) {
        getContacts.push(...contacts);
        getContacts.sort();
        getContacts = getContacts.filter(
          (v: string, i: number, a: string) => a.indexOf(v) === i
        );

        // Adiciona a regra de reset ao atingir 1000 contatos
        if (getContacts.length > 1000) {
          console.log("Limite de 1000 contatos atingido. Resetando...");
          getContacts = [];
        }
      }

      const newBaileys = await baileysExists.update({
        chats: JSON.stringify(getChats),
        contacts: JSON.stringify(getContacts)
      });

      return newBaileys;
    }

    const baileys = await Baileys.create({
      whatsappId,
      contacts: JSON.stringify(contacts),
      chats: JSON.stringify(chats)
    });

    return baileys;
  } catch (error) {
    console.log(error);
  }
};

export default createOrUpdateBaileysService;
