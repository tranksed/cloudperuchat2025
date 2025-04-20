import { Op } from "sequelize";
import { add, sub } from "date-fns";

import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import ShowTicketService from "./ShowTicketService";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import { isNil } from "lodash";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import CompaniesSettings from "../../models/CompaniesSettings";
import CreateLogTicketService from "./CreateLogTicketService";
import AppError from "../../errors/AppError";

import { NotifyPlantaoService } from "../PlantaoServices/NotifyPlantaoService";
import Message from "../../models/Message";

interface Response {
  ticket: Ticket;
  isCreated: boolean;
}

const FindOrCreateTicketService = async (
  contact: Contact,
  whatsapp: Whatsapp,
  unreadMessages: number,
  companyId: number,
  queueId?: number,
  userId?: number,
  groupContact?: Contact,
  channel?: string,
  isImported?: boolean,
  isForward?: boolean,
  settings?: any
): Promise<Response> => {
  // try {
  let isCreated = false;

  let notification = false;

  let openAsLGPD = false
  if (settings.enableLGPD) { //adicionar lgpdMessage
    openAsLGPD = settings.enableLGPD === "enabled" && settings.lgpdMessage !== "" && (settings.lgpdConsent === "enabled" || (settings.lgpdConsent === "disabled" && isNil(contact.lgpdAcceptedAt)))
  }

  const io = getIO();

  let ticket = await Ticket.findOne({
    where: {
      status: {
        [Op.or]: ["open", "pending", "group", "nps", "lgpd"]
      },
      contactId: groupContact ? groupContact.id : contact.id,
      companyId,
      whatsappId: whatsapp.id
    },
    order: [["id", "DESC"]]
  });

  if (ticket) {

    await ticket.update({ unreadMessages, isBot: false });
    ticket = await ShowTicketService(ticket.id, companyId);

    if (!ticket.isGroup) {
      // @ts-ignore: Unreachable code error
      if (ticket?.userId && ((Number(ticket?.userId) !== Number(userId) && userId !== 0 && userId !== "") || (queueId !== 0 && Number(ticket?.queueId) !== Number(queueId) && queueId !== ""))) {
        // throw new AppError(`Ticket em outro atendimento. ${"Atendente: " + ticket?.user?.name} - ${"Fila: " + ticket?.queue?.name}`);
      }
    }

    isCreated = true;

    return { ticket, isCreated };;
  }

  const timeCreateNewTicket = whatsapp.timeCreateNewTicket;

  if (!ticket) {
    if (timeCreateNewTicket && timeCreateNewTicket !== 0) {

      ticket = await Ticket.findOne({
        where: {
          updatedAt: {
            [Op.between]: [
              +sub(new Date(), {
                minutes: Number(timeCreateNewTicket)
              }),
              +new Date()
            ]
          },
          contactId: contact.id,
          companyId,
          whatsappId: whatsapp.id
        },
        order: [["updatedAt", "DESC"]]
      });
    }

    if (ticket && ticket.status !== "nps") {
      await ticket.update({
        status: "pending",
        unreadMessages,
        companyId,
        // queueId: timeCreateNewTicket === 0 ? null : ticket.queueId
      });
    }
  }

  if (!ticket) {
    ticket = await Ticket.create({
      contactId: groupContact ? groupContact.id : contact.id,
      status: (!isImported && !isNil(settings.enableLGPD)
        && openAsLGPD && !groupContact) ? //verifica se lgpd está habilitada e não é grupo e se tem a mensagem e link da política
        "lgpd" :  //abre como LGPD caso habilitado parâmetro
        (whatsapp.groupAsTicket === "enabled" || !groupContact) ? // se lgpd estiver desabilitado, verifica se é para tratar ticket como grupo ou se é contato normal
          "pending" : //caso  é para tratar grupo como ticket ou não é grupo, abre como pendente
          "group", // se não é para tratar grupo como ticket, vai direto para grupos
      isGroup: !!groupContact,
      unreadMessages,
      whatsappId: whatsapp.id,
      companyId,
      isBot: groupContact ? false : true,
      channel,
      imported: isImported ? new Date() : null
    });

    await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      whatsappId: whatsapp.id,
      userId: ticket.userId
    });
    isCreated = true;
  }


  if (queueId != 0 && queueId != undefined) {
    //Determina qual a fila esse ticket pertence.
    await ticket.update({ queueId: queueId });
  }

  if (userId != 0 && userId != undefined) {
    //Determina qual a fila esse ticket pertence.
    await ticket.update({ userId: userId });
  }

  ticket = await ShowTicketService(ticket.id, companyId);

  notification = ticket.status === 'pending' ? true : false;

  const lastMessage = await Message.findOne({
    where: {
      ticketId: ticket.id
    },
    order: [["id", "DESC"]]
  });

  await CreateLogTicketService({
    ticketId: ticket.id,
    type: openAsLGPD ? "lgpd" : "create"
  });

  if (!isForward) {
    io.to(ticket.status)
      .to("notification")
      .to(ticket.id.toString())
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });
  };

  const fromMe = lastMessage?.fromMe || false;

  if (new Date() >= ticket.nextNotify && notification && !fromMe) {
    await NotifyPlantaoService({ companyId, ticket });
  }

  return { ticket, isCreated };
  // } catch (err) {
  //   logger.error("Error to find or create a ticket:", err);
  // }
};

export default FindOrCreateTicketService;
