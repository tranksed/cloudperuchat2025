import { Request, Response } from "express";
import AppError from "../errors/AppError";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Queue from "../models/Queue";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import { verify } from "jsonwebtoken";
import authConfig from "../config/auth";
import path from "path";
import { isNil, isNull } from "lodash";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CreateMessageService from "../services/MessageServices/CreateMessageService";

import { sendFacebookMessageMedia } from "../services/FacebookServices/sendFacebookMessageMedia";
import sendFaceMessage from "../services/FacebookServices/sendFacebookMessage";

import ShowPlanCompanyService from "../services/CompanyService/ShowPlanCompanyService";
import ListMessagesServiceAll from "../services/MessageServices/ListMessagesServiceAll";
import ShowContactService from "../services/ContactServices/ShowContactService";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";

import Contact from "../models/Contact";

import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import ListSettingsService from "../services/SettingServices/ListSettingsService";
import ShowMessageService, { GetWhatsAppFromMessage } from "../services/MessageServices/ShowMessageService";
import CompaniesSettings from "../models/CompaniesSettings";
import EditWhatsAppMessage from "../services/MessageServices/EditWhatsAppMessage";
import ListImagesService from "../services/MessageServices/ListImagesService";
import ListAllMediaService from "../services/MessageServices/ListAllMediaService";
import { getWbot } from "../libs/wbot";


type IndexQuery = {
  pageNumber: string;
  ticketTrakingId: string;
  selectedQueues?: string;
};

type ReactMessageData = {
  text: string,
  fromMe: string,
  id: string,
  remoteJid: string,
  ticketId: string,
}

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}


type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
  number?: string;
  isPrivate?: boolean;
  vCard?: Contact;
  quotedMsgId?: number | string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber, selectedQueues: queueIdsStringified } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  let queues: number[] = [];

  const user = await User.findByPk(req.user.id, {
    include: [{ model: Queue, as: "queues" }]
  });

  if (queueIdsStringified) {
    queues = JSON.parse(queueIdsStringified);
  } else {
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId,
    companyId,
    queues,
    user
  });

  if (ticket.channel === "whatsapp") {
    SetTicketMessagesAsRead(ticket);
  }

  return res.json({ count, messages, ticket, hasMore });
};

function obterNomeEExtensaoDoArquivo(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const filename = pathname.split('/').pop();
  // var parts = filename.split('.');

  // var nomeDoArquivo = parts[0];
  // var extensao = parts[1];

  const extensao = path.extname(filename);
  const nomeDoArquivo = filename.replace(extensao, "");

  return `${nomeDoArquivo}${extensao}`;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg,quotedMsgId, isPrivate, vCard }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  const { companyId } = req.user;

  const ticket = await ShowTicketService(ticketId, companyId);

  if (ticket.channel === "whatsapp") {
    SetTicketMessagesAsRead(ticket);
  }

  try {
    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          if (ticket.channel === "whatsapp") {
            await SendWhatsAppMedia({ media, ticket, body, isPrivate: /\u200d/.test(body), isForwarded: false, quotedMsgId });
          }

          if (ticket.channel === "facebook" || ticket.channel === "instagram") {
            try {
              await sendFacebookMessageMedia({
                media,
                ticket
              });
            } catch (error) {
              console.log(error);
            }
          }
        })
      );
    } else {
      if (ticket.channel === "whatsapp" && !isPrivate) {
        await SendWhatsAppMessage({ body, ticket, quotedMsg, isPrivate, vCard });
      }

      if (ticket.channel === "whatsapp" && isPrivate) {
        const messageData = {
          wid: `PVT${ticket.updatedAt.toString().replace(' ', '')}`,
          ticketId: ticket.id,
          contactId: undefined,
          body,
          fromMe: true,
          mediaType: !isNil(vCard) ? 'contactMessage' : 'extendedTextMessage',
          read: true,
          quotedMsgId: null,
          ack: 2,
          remoteJid: ticket.contact?.remoteJid,
          participant: null,
          dataJson: null,
          ticketTrakingId: null,
          isPrivate
        };

        await CreateMessageService({ messageData, companyId: ticket.companyId });

      }

      if (ticket.channel === "facebook" || ticket.channel === "instagram") {
        await sendFaceMessage({ body, ticket, quotedMsg });
      }
    }
    return res.send();
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
};

export const forwardmessage = async (req: Request, res: Response): Promise<Response> => {

  const authHeader = req.headers.authorization;
  const [, token] = authHeader.split(" ");
  const decoded = verify(token, authConfig.secret);
  //const { id: requestUserId } = decoded as TokenPayload;
  const { id: userId } = req.user;
  const requestUser = await User.findByPk(userId);

  const { currentContacts, message, signMessage } = req.body;

  const { companyId } = message;

  const settings = await CompaniesSettings.findOne({
    where: { companyId }
  }
  )

  const quotedMsg = message.quotedMsgId;

  let body: string;

  currentContacts.map(async c => {
    const contact = await ShowContactService(c.id, message.companyId);
    const ticket = await ShowTicketService(message.ticketId, message.companyId);
    const { ticket: createTicket, isCreated } = await FindOrCreateTicketService(
      contact,
      ticket?.whatsapp,
      0,
      ticket.companyId,
      ticket.queueId,
      requestUser.id,
      contact.isGroup ? contact : null,
      "whatsapp",
      null,
      true,
      settings
    );

    const ticketData = {
      status: createTicket.isGroup ? "group" : "open",
      userId: requestUser.id,
      queueId: ticket.queueId
    }

    await UpdateTicketService({
      ticketData,
      ticketId: createTicket.id,
      companyId: createTicket.companyId
    });

    if (ticket.channel === "whatsapp") {

      if (message.mediaUrl) {

        body = `_Encaminhada_`;


        const mediaUrl = message.mediaUrl.replace(`:${process.env.PORT}`, '');
        const fileName = obterNomeEExtensaoDoArquivo(mediaUrl);

        const publicFolder = path.join(__dirname, '..', '..', '..', 'backend', 'public');

        const filePath = path.join(publicFolder, `company${ticket.companyId}`, fileName)

        const mediaSrc = {
          fieldname: 'medias',
          originalname: fileName,
          encoding: '7bit',
          mimetype: message.mediaType,
          filename: fileName,
          path: filePath
        } as Express.Multer.File

        await SendWhatsAppMedia({ media: mediaSrc, ticket: createTicket, body, isForwarded: false });
      } else {
        if (signMessage) {
          body = `*Mensagem encaminhada de ${requestUser.name}*\n\n${message.body}`
        } else {
          body = `${message.body}`;
        }
        await SendWhatsAppMessage({ body, ticket: createTicket, quotedMsg });
      }
    }

  })

  return res.json('count');
};

export const forwardMessage = async (req: Request, res: Response): Promise<Response> => {

  console.log('>>>>>>>>>>>>>>>>>forwardMessage X<<<<<<<<<<<<<<<<<<<');
  const { quotedMsg, signMessage, messageId, contactId } = req.body;
  const { id: userId, companyId } = req.user;
  const requestUser = await User.findByPk(userId);

  if (!messageId || !contactId) {
    return res.status(200).send("MessageId or ContactId not found");
  }

  const message = await ShowMessageService(messageId);
  const contact = await ShowContactService(contactId, companyId);

  if (!message) {
    return res.status(404).send("Message not found");
  }
  if (!contact) {
    return res.status(404).send("Contact not found");
  }

  const settings = await CompaniesSettings.findOne({
    where: { companyId }
  }
  )

  const whatsAppConnectionId = await GetWhatsAppFromMessage(message);
  if (!whatsAppConnectionId) {
    return res.status(404).send('Whatsapp from message not found');
  }

  const ticket = await ShowTicketService(message.ticketId, message.companyId);

  const { ticket: createTicket } = await FindOrCreateTicketService(
    contact,
    ticket?.whatsapp,
    0,
    ticket.companyId,
    ticket.queueId,
    requestUser.id,
    contact.isGroup ? contact : null,
    "whatsapp",
    null,
    true,
    settings
  );

  let ticketData;

  if (isNil(createTicket?.queueId)) {
    ticketData = {
      status: createTicket.isGroup ? "group" : "open",
      userId: requestUser.id,
      queueId: ticket.queueId
    }
  } else {
    ticketData = {
      status: createTicket.isGroup ? "group" : "open",
      userId: requestUser.id
    }
  }

  await UpdateTicketService({
    ticketData,
    ticketId: createTicket.id,
    companyId: createTicket.companyId
  });


  let body = message.body;

  if (message.mediaType === 'conversation' || message.mediaType === 'extendedTextMessage') {
    await SendWhatsAppMessage({ body, ticket: createTicket, quotedMsg, isForwarded: true });
  } else {

    const mediaUrl = message.mediaUrl.replace(`:${process.env.PORT}`, '');
    const fileName = obterNomeEExtensaoDoArquivo(mediaUrl);

    if (body === fileName) {
      body = "";
    }

    const publicFolder = path.join(__dirname, '..', '..', '..', 'backend', 'public');

    const filePath = path.join(publicFolder, `company${createTicket.companyId}`, fileName)

    const mediaSrc = {
      fieldname: 'medias',
      originalname: fileName,
      encoding: '7bit',
      mimetype: message.mediaType,
      filename: fileName,
      path: filePath
    } as Express.Multer.File

    await SendWhatsAppMedia({ media: mediaSrc, ticket: createTicket, body, isForwarded: true });
  }

  return res.send();
}

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await DeleteWhatsAppMessage(messageId);
  const io = getIO();

  if (message.isPrivate) {
    await Message.destroy({
      where: {
        id: message.id
      }
    });
    io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
      action: "delete",
      message
    });
  }

  io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};

export const allMe = async (req: Request, res: Response): Promise<Response> => {

  const dateStart: any = req.query.dateStart;
  const dateEnd: any = req.query.dateEnd;
  const fromMe: any = req.query.fromMe;

  const { companyId } = req.user;

  const { count } = await ListMessagesServiceAll({
    companyId,
    fromMe,
    dateStart,
    dateEnd
  });

  return res.json({ count });
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const messageData: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  try {

    const authHeader = req.headers.authorization;
    const [, token] = authHeader.split(" ");

    const whatsapp = await Whatsapp.findOne({ where: { token } });
    const companyId = whatsapp.companyId;
    const company = await ShowPlanCompanyService(companyId);
    const sendMessageWithExternalApi = company.plan.useExternalApi

    if (sendMessageWithExternalApi) {

      if (!whatsapp) {
        throw new Error("Não foi possível realizar a operação");
      }

      if (messageData.number === undefined) {
        throw new Error("O número é obrigatório");
      }

      const number = messageData.number;
      const body = messageData.body;

      if (medias) {
        await Promise.all(
          medias.map(async (media: Express.Multer.File) => {
            req.app.get("queues").messageQueue.add(
              "SendMessage",
              {
                whatsappId: whatsapp.id,
                data: {
                  number,
                  body: media.originalname.replace('/', '-'),
                  mediaPath: media.path
                }
              },
              { removeOnComplete: true, attempts: 3 }
            );
          })
        );
      } else {
        req.app.get("queues").messageQueue.add(
          "SendMessage",
          {
            whatsappId: whatsapp.id,
            data: {
              number,
              body
            }
          },
          { removeOnComplete: true, attempts: 3 }
        );
      }
      return res.send({ mensagem: "Mensagem enviada!" });
    }
    return res.status(400).json({ error: 'Essa empresa não tem permissão para usar a API Externa. Entre em contato com o Suporte para verificar nossos planos!' });

  } catch (err: any) {

    console.log(err);
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};

export const edit = async (req: Request, res: Response): Promise<Response> => {
  const { messageId } = req.params;
  const { companyId } = req.user;
  const { body }: MessageData = req.body;

  const { ticket, message } = await EditWhatsAppMessage({ messageId, body });

  const io = getIO();
  io.to(String(ticket.id))
    .emit(`company-${companyId}-appMessage`, {
      action: "update",
      message
    });

  io.to(ticket.status)
    .to("notification")
    .to(String(ticket.id))
    .emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });
  return res.send();
}

export const ListImages = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  const { images } = await ListImagesService({
    ticketId,
  });

  return res.json({ images });
};

export const GetTicketMedia = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  const { media, documents, links, calls } = await ListAllMediaService({
    ticketId,
  });

  return res.json({ media, documents, links, calls });
};

export const ReactMessage = async (req: Request, res: Response): Promise<Response> => {

  const { companyId } = req.user;
  const data: ReactMessageData = req.body;
  const ticket = await ShowTicketService(data.ticketId, companyId);
  const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);

  const wbot = getWbot(whatsapp.id);

  // se tiver quoted message quer dizer que ja foi reagida

  /**
   * pegar a mensagem pelo data.id
   * verificar se alguma mensagem faz um quoted nela e se esse quoted é um reactionMessage
   * se for um reactMessage verificar se o data.text é igual ao quoted.body que foi encontrado ... se for igual envia um react '' e apaga a mensagem atual
   * se nao atualiza a mensagem com a nova reação.
   */

  // const message = await Message.findOne({
  //   where: {
  //     wid: data.id,
  //     companyId
  //   },

  // });

  // const messageQuoted = await Message.findOne({
  //   where: {
  //     quotedMsgId: message.id,
  //     companyId
  //   },
  //   include: [
  //     {
  //       model: Message,
  //       as: "quotedMsg",
  //     },
  //   ],
  //   order: [["id", "DESC"]],
  // });


  // if (messageQuoted && messageQuoted.mediaType == 'reactionMessage') {

  //   const quotedMessageType = messageQuoted.mediaType;
  //   const bodyMessage = messageQuoted.body;


  //   if (bodyMessage === data.text) {
  //     console.log('esta removendo a reacao')



  //     // const io = getIO();

  //     // io.to(messageQuoted.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
  //     //   action: "delete",
  //     //   messageQuoted
  //     // });

  //   }


  // }


  await wbot.sendMessage(data.remoteJid, {
    react: {
      text: data.text, // emoji
      key: {
        fromMe: data.fromMe === "true",
        remoteJid: data.remoteJid,
        id: data.id // nessa mensagem
      }
    }
  });


  return res.send();
}

