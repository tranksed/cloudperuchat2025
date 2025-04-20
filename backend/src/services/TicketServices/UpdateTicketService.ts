import moment from "moment";
import * as Sentry from "@sentry/node";
import { Op } from "sequelize";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import { isNil } from "lodash";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import { verifyMessageFace } from "../FacebookServices/facebookMessageListener";
import ShowUserService from "../UserServices/ShowUserService";
import User from "../../models/User";
import CompaniesSettings from "../../models/CompaniesSettings";
import CreateLogTicketService from "./CreateLogTicketService";
import TicketTag from "../../models/TicketTag";
import Tag from "../../models/Tag";
import formatBody from "../../helpers/Mustache";
import DeleteDialogChatBotsServices from '../DialogChatBotsServices/DeleteDialogChatBotsServices';

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  isBot?: boolean;
  chatbot?: boolean;
  queueOptionId?: number;
  sendFarewellMessage?: boolean;
  amountUsedBotQueues?: number;
  lastMessage?: string;
  integrationId?: number;
  useIntegration?: boolean;
  promptId?: number | null;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;
}

interface Response {
  ticket: Ticket;
  oldStatus: string;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<Response> => {
  try {
    const { status } = ticketData;
    let { queueId, userId, sendFarewellMessage, amountUsedBotQueues, lastMessage, integrationId, useIntegration } = ticketData;
    let isBot: boolean | null = ticketData.isBot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;
    let promptId: number | null = ticketData.promptId || null;

    const io = getIO();

    const settings = await CompaniesSettings.findOne({
      where: {
        companyId: companyId
      }
    });

    const ticket = await ShowTicketService(ticketId, companyId);


    if (ticket.channel === "whatsapp") {
      await SetTicketMessagesAsRead(ticket);
    }

    const oldStatus = ticket?.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket?.queueId;


    if (oldStatus === "closed") {
      const otherTicket = await Ticket.findOne({
        where: {
          contactId: ticket.contactId,
          status: { [Op.or]: ["open", "pending", "group"] },
          whatsappId: ticket.whatsappId
        },
        include: [{
          model: Queue,
          as: "queue",
          attributes: ["id", "name", "color"]
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"]
        }]
      });
      if (otherTicket) {
        if (otherTicket.id !== ticket.id) {

          return { ticket: otherTicket, oldStatus, oldUserId }
        }
      }

      // await CheckContactOpenTickets(ticket.contactId, ticket.whatsappId );
      isBot = false;
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket.whatsappId
    });

    const { complationMessage, ratingMessage, groupAsTicket } = await ShowWhatsAppService(
      ticket.whatsappId,
      companyId
    );

    if (status !== undefined && ["closed"].indexOf(status) > -1) {

      if (
        settings.userRating === "enabled" &&
        (!isNil(ratingMessage) && ratingMessage !== "") &&
        !ticket.isGroup &&
        (sendFarewellMessage || sendFarewellMessage === undefined)
      ) {

        if (!ticketTraking.ratingAt) {

          const ratingTxt = ratingMessage || "";
          let bodyRatingMessage = `\u200e${ratingTxt}\n`;

          if (ticket.channel === "whatsapp") {
            const msg = await SendWhatsAppMessage({ body: bodyRatingMessage, ticket, isForwarded: false, isPrivate: false });
            await verifyMessage(msg, ticket, ticket.contact);
          }

          if (["facebook", "instagram"].includes(ticket.channel)) {
            const msg = await sendFaceMessage({ body: bodyRatingMessage, ticket });
            await verifyMessageFace(msg, bodyRatingMessage, ticket, ticket.contact);
          }

          await ticketTraking.update({
            userId: ticket.userId,
            closedAt: moment().toDate(),
            status: "nps"
          });

          await CreateLogTicketService({
            userId: ticket.userId,
            queueId: ticket.queueId,
            ticketId,
            type: "nps"
          });

          try {
            // Retrieve tagIds associated with the provided ticketId from TicketTags
            const ticketTags = await TicketTag.findAll({ where: { ticketId } });
            const tagIds = ticketTags.map((ticketTag) => ticketTag.tagId);

            // Find the tagIds with kanban = 1 in the Tags table
            const tagsWithKanbanOne = await Tag.findAll({
              where: {
                id: tagIds,
                kanban: 1,
              },
            });

            // Remove the tagIds with kanban = 1 from TicketTags
            const tagIdsWithKanbanOne = tagsWithKanbanOne.map((tag) => tag.id);
            if (tagIdsWithKanbanOne)
              await TicketTag.destroy({ where: { ticketId, tagId: tagIdsWithKanbanOne } });
          } catch (error) {
            Sentry.captureException(error);
          }

          await ticket.update({
            status: "nps",
            amountUseBotQueuesNPS: 1
          })

          io.to(oldStatus)
            .to(ticketId.toString())
            .emit(`company-${ticket.companyId}-ticket`, {
              action: "delete",
              ticketId: ticket.id
            });

          return { ticket, oldStatus, oldUserId };

        }
      }

      if (!isNil(complationMessage) && complationMessage !== "" && (sendFarewellMessage || sendFarewellMessage === undefined)) {

        const _userId = ticket.userId || userId;

        const user = await User.findByPk(_userId);

        let body: any

        if ((ticket.status !== 'pending') || (ticket.status === 'pending' && settings.sendFarewellWaitingTicket === 'enabled')) {

          if (user.farewellMessage) {
            body = `\u200e${user.farewellMessage}`;
          } else {
            body = `\u200e${complationMessage}`;
          }
          if (ticket.channel === "whatsapp" && (!ticket.isGroup || groupAsTicket === "enabled")) {
            const sentMessage = await SendWhatsAppMessage({ body, ticket, isForwarded: false, isPrivate: false });

            await verifyMessage(sentMessage, ticket, ticket.contact);

          }

          if (["facebook", "instagram"].includes(ticket.channel) && (!ticket.isGroup || groupAsTicket === "enabled")) {
            const sentMessage = await sendFaceMessage({ body, ticket });
          }
        }
      }

      await ticket.update({
        promptId: null,
        integrationId: null,
        useIntegration: false,
        typebotStatus: false,
        typebotSessionId: null
      })

      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.closedAt = moment().toDate();
      ticketTraking.whatsappId = ticket.whatsappId;
      ticketTraking.userId = ticket.userId;
      ticketTraking.contactId = ticket.contactId;
      ticketTraking.queueId = ticket.queueId;
      ticketTraking.lastMessage = lastMessage ? lastMessage : ticket.lastMessage;
      ticketTraking.status = status;

      // queueId = null;
      // userId = null;
      //loga fim de atendimento
      await CreateLogTicketService({
        userId,
        queueId: ticket.queueId,
        ticketId,
        type: "closed"
      });

      try {
        // Retrieve tagIds associated with the provided ticketId from TicketTags
        const ticketTags = await TicketTag.findAll({ where: { ticketId } });
        const tagIds = ticketTags.map((ticketTag) => ticketTag.tagId);

        // Find the tagIds with kanban = 1 in the Tags table
        const tagsWithKanbanOne = await Tag.findAll({
          where: {
            id: tagIds,
            kanban: 1,
          },
        });

        // Remove the tagIds with kanban = 1 from TicketTags
        const tagIdsWithKanbanOne = tagsWithKanbanOne.map((tag) => tag.id);
        if (tagIdsWithKanbanOne)
          await ticketTraking.save();
          await TicketTag.destroy({ where: { ticketId, tagId: tagIdsWithKanbanOne } });
      } catch (error) {
        Sentry.captureException(error);
      }

      await ticket.update({
        status: "closed"
      });

      await DeleteDialogChatBotsServices(ticket.contactId);

      io.to(oldStatus)
        .to(ticketId.toString())
        .emit(`company-${ticket.companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });

      return { ticket, oldStatus, oldUserId };
    }


    if (queueId !== undefined && queueId !== null) {
      ticketTraking.update({
        queuedAt: moment().toDate(),
        status: status,
        userId: ticket.userId,
        contactId: ticket.contactId,
        queueId: ticket.queueId,
        lastMessage: lastMessage ? lastMessage : ticket.lastMessage,
      })
    }

    if (settings.sendMsgTransfTicket === "enabled") {
      // Mensagem de transferencia da FILA
      if (oldQueueId !== queueId && oldUserId === userId && !isNil(oldQueueId) && !isNil(queueId)) {

        const queue = await Queue.findByPk(queueId);
        const wbot = await GetTicketWbot(ticket);


        const msgtxt = `\u200e*Mensagem Automática*:\nVocê foi transferido(a) para o departamento *${queue?.name}"*\nAguarde um momento, iremos atende-lo(a)!`;


        const bodyMsg = formatBody(`${msgtxt}`, ticket);
        const queueChangedMessage = await wbot.sendMessage(
          `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: bodyMsg
          }
        );
        await verifyMessage(queueChangedMessage, ticket, ticket.contact, ticketTraking);
      }
      else
        // Mensagem de transferencia do ATENDENTE
        if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId) && (!ticket.isGroup || groupAsTicket === "enabled")) {

          const wbot = await GetTicketWbot(ticket);

          const nome = await ShowUserService(ticketData.userId);

          const msgtxt = `\u200e*Mensagem Automática*:\nVocê foi transferido(a) para o atendente *${nome.name}*\nAguarde um momento, iremos atende-lo(a)!`;


          const bodyMsg = formatBody(`${msgtxt}`, ticket);
          const queueChangedMessage = await wbot.sendMessage(
            `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            {
              text: bodyMsg
            }
          );
          await verifyMessage(queueChangedMessage, ticket, ticket.contact, ticketTraking);
        }
        else
          // Mensagem de transferencia do ATENDENTE e da FILA
          if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId) && (!ticket.isGroup || groupAsTicket === "enabled")) {
            const wbot = await GetTicketWbot(ticket);
            const queue = await Queue.findByPk(queueId);
            const nome = await ShowUserService(ticketData.userId);

            const msgtxt = `\u200e*Mensagem Automática*:\nVocê foi transferido(a) para o departamento *${queue?.name}* e será atendido por *${nome.name}*\nAguarde um momento, iremos atende-lo(a)!`;

            const bodyMsg = formatBody(`${msgtxt}`, ticket);
            const queueChangedMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                text: bodyMsg
              }
            );
            await verifyMessage(queueChangedMessage, ticket, ticket.contact);
          } else
            if (oldUserId !== undefined && isNil(userId) && oldQueueId !== queueId && !isNil(queueId)) {

              const queue = await Queue.findByPk(queueId);
              const wbot = await GetTicketWbot(ticket);

              const msgtxt = "*Mensagem Automática*:\nVocê foi transferido(a) para o departamento *" + queue?.name + "*\nAguarde um momento, iremos atende-lo(a)!";

              const bodyMsg = formatBody(`${msgtxt}`, ticket);
              const queueChangedMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                  text: bodyMsg
                }
              );
              await verifyMessage(queueChangedMessage, ticket, ticket.contact);
            }

    }

    if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId)) {
      //transferiu o atendimento para fila
      await CreateLogTicketService({
        userId: oldUserId,
        queueId: oldQueueId,
        ticketId,
        type: "transfered"
      });

    } else
      if (oldUserId !== userId && oldQueueId === queueId && !isNil(oldUserId) && !isNil(userId)) {
        //transferiu o atendimento para atendente na mesma fila
        await CreateLogTicketService({
          userId: oldUserId,
          queueId: oldQueueId,
          ticketId,
          type: "transfered"
        });
        //recebeu atendimento
        await CreateLogTicketService({
          userId,
          queueId: oldQueueId,
          ticketId,
          type: "receivedTransfer"
        });
      } else
        if (oldUserId !== userId && oldQueueId !== queueId && !isNil(oldUserId) && !isNil(userId)) {
          //transferiu o atendimento para fila e atendente

          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
          //recebeu atendimento
          await CreateLogTicketService({
            userId,
            queueId,
            ticketId,
            type: "receivedTransfer"
          });
        } else
          if (oldUserId !== undefined && isNil(userId) && oldQueueId !== queueId && !isNil(queueId)) {
            await CreateLogTicketService({
              userId: oldUserId,
              queueId: oldQueueId,
              ticketId,
              type: "transfered"
            });
          }

    await ticket.update({
      status,
      queueId,
      userId,
      isBot,
      queueOptionId,
      amountUsedBotQueues: status === "closed" ? 0 : amountUsedBotQueues ? amountUsedBotQueues : ticket.amountUsedBotQueues,
      lastMessage: lastMessage ? lastMessage : ticket.lastMessage,
      useIntegration,
      integrationId
    });


    ticketTraking.update({
      queuedAt: moment().toDate(),
      queueId: queueId,
      userId: status !== "closed" ? userId : ticket.userId,
      lastMessage: lastMessage ? lastMessage : ticket.lastMessage
    })


    await ticket.reload();

    if (status !== undefined && ["pending"].indexOf(status) > -1 && !isNil(oldUserId)) {
      //ticket voltou para fila
      await CreateLogTicketService({
        userId: oldUserId,
        ticketId,
        type: "pending"
      });
      ticketTraking.update({
        whatsappId: ticket.whatsappId,
        queueAt: moment().toDate(),
        startedAt: null,
        userId: null,
        queueId: null,
        lastMessage: lastMessage ? lastMessage : ticket.lastMessage
      });
    }

    if (status !== undefined && status !== oldStatus && ["open"].indexOf(status) > -1) {
      ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId,
        queueId: ticket.queueId,
        contactId: ticket.contactId,
        lastMessage: lastMessage ? lastMessage : ticket.lastMessage,
        status
      });

      //loga inicio de atendimento
      await CreateLogTicketService({
        userId: userId,
        queueId: ticket.queueId,
        ticketId,
        type: "open"
      });

      await DeleteDialogChatBotsServices(ticket.contactId);
    }

    await ticketTraking.save();


    if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId) {
      ticketTraking.update({
        userId: ticket.userId
      })

      io.to(oldStatus).emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });
    }

    io.to(ticket.status)
      .to("notification")
      .to(ticketId.toString())
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });


    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    Sentry.captureException(err);
  }
};

export default UpdateTicketService;
