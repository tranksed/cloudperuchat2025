import {
  WASocket,
  BinaryNode,
  Contact as BContact,
} from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";

import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import createOrUpdateBaileysService from "../BaileysServices/CreateOrUpdateBaileysService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import CompaniesSettings from "../../models/CompaniesSettings";
import { json } from "sequelize";
import Setting from "../../models/Setting";

type Session = WASocket & {
  id?: number;
};

interface IContact {
  contacts: BContact[];
}

const wbotMonitor = async (
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  try {
    wbot.ws.on("CB:call", async (node: BinaryNode) => {
      const content = node.content[0] as any;

      if (content.tag === "terminate" && !node.attrs.from.includes('@call')) {
        const settings = await CompaniesSettings.findOne({
          where: { companyId },
        });


        if (settings.acceptCallWhatsapp === "enabled") {
          await wbot.sendMessage(node.attrs.from, {
            text:
              "*Mensagem Automática:*\n\nAs chamadas de voz e vídeo estão desabilitas para esse WhatsApp, favor enviar uma mensagem de texto. Obrigado",
          });

          const number = node.attrs.from.replace(/\D/g, "");

          const contact = await Contact.findOne({
            where: { companyId, number },
          });

          const ticket = await Ticket.findOne({
            where: {
              contactId: contact.id,
              whatsappId: wbot.id,
              //status: { [Op.or]: ["close"] },
              companyId
            },
          });
          // se não existir o ticket não faz nada.
          if (!ticket) return;

          const date = new Date();
          const hours = date.getHours();
          const minutes = date.getMinutes();

          const body = `Chamada de voz/vídeo perdida às ${hours}:${minutes}`;
          const messageData = {
            wid: content.attrs["call-id"],
            ticketId: ticket.id,
            contactId: contact.id,
            body,
            fromMe: false,
            mediaType: "call_log",
            read: true,
            quotedMsgId: null,
            ack: 1,
          };

          await ticket.update({
            lastMessage: body,
          });


          if (ticket.status === "closed") {
            await ticket.update({
              status: "pending",
            });
          }

          return CreateMessageService({ messageData, companyId: companyId });
        }
      }
    });



    wbot.ev.on("contacts.upsert", async (contacts: BContact[]) => {

      console.log("upsert", contacts);

      await createOrUpdateBaileysService({
        whatsappId: whatsapp.id,
        contacts,
      });
    });

    // captura os contatos do whatsapp


  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};

export default wbotMonitor;
