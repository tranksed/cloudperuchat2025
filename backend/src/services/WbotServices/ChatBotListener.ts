import { proto, WASocket } from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";

import path, { join } from "path";

import { getBodyMessage, verifyMediaMessage, verifyMessage } from "./wbotMessageListener";
import ShowDialogChatBotsServices from "../DialogChatBotsServices/ShowDialogChatBotsServices";
import ShowQueueService from "../QueueService/ShowQueueService";
import ShowChatBotServices from "../ChatBotServices/ShowChatBotServices";
import DeleteDialogChatBotsServices from "../DialogChatBotsServices/DeleteDialogChatBotsServices";
import ShowChatBotByChatbotIdServices from "../ChatBotServices/ShowChatBotByChatbotIdServices";
import CreateDialogChatBotsServices from "../DialogChatBotsServices/CreateDialogChatBotsServices";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import formatBody from "../../helpers/Mustache";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import Chatbot from "../../models/Chatbot";
import User from "../../models/User";
import ShowFileService from "../../services/FileServices/ShowService";
import { isNil, isNull } from "lodash";

import SendWhatsAppMedia, { getMessageOptions } from "./SendWhatsAppMedia";
import CompaniesSettings from "../../models/CompaniesSettings";

const fs = require('fs')
var axios = require('axios');

type Session = WASocket & {
  id?: number;
};

const isNumeric = (value: string) => /^-?\d+$/.test(value);

export const deleteAndCreateDialogStage = async (
  contact: Contact,
  chatbotId: number,
  ticket: Ticket
) => {
  try {
    await DeleteDialogChatBotsServices(contact.id);
    const bots = await ShowChatBotByChatbotIdServices(chatbotId);
    if (!bots) {
      await ticket.update({ isBot: false });
    }
    return await CreateDialogChatBotsServices({
      awaiting: 1,
      contactId: contact.id,
      chatbotId,
      queueId: bots.queueId
    });
  } catch (error) {
    await ticket.update({ isBot: false });
  }
};

const sendMessage = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  body: string
) => {
  const sentMessage = await wbot.sendMessage(
    `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
    {
      text: formatBody(body, ticket)
    }
  );
  verifyMessage(sentMessage, ticket, contact);
};

const sendMessageLink = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage
  try {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        document: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
        fileName: caption,
        mimetype: 'application/pdf'
      }
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: formatBody('\u200eNão consegui enviar o PDF, tente novamente!', ticket)
      }
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};

const sendMessageImage = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket,
  url: string,
  caption: string
) => {

  let sentMessage
  try {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        image: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
        fileName: caption,
        caption: caption,
        mimetype: 'image/jpeg'
      }
    );
  } catch (error) {
    sentMessage = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: formatBody('Não consegui enviar o PDF, tente novamente!', ticket)
      }
    );
  }
  verifyMessage(sentMessage, ticket, contact);
};


const sendDialog = async (
  choosenQueue: Chatbot,
  wbot: Session,
  contact: Contact,
  ticket: Ticket
) => {
  const showChatBots = await ShowChatBotServices(choosenQueue.id);
  if (showChatBots.options) {

    let companyId = ticket.companyId;
    const buttonActive = await CompaniesSettings.findOne({
      where:{companyId}
    })


    const typeBot = buttonActive?.chatBotType || "text";

    const botText = async () => {
      let options = "";

      showChatBots.options.forEach((option, index) => {
        options += `*[ ${index + 1} ]* - ${option.name}\n`;
      });

      const optionsBack =
        options.length > 0
          ? `${options}\n*[ # ]* Voltar para o menu principal\n*[ Sair ]* Encerrar atendimento`
          : `${options}\n*[ Sair ]* Encerrar atendimento`;

      if (options.length > 0) {
        const body = `\u200e${choosenQueue.greetingMessage}\n\n${optionsBack}`;
        const sendOption = await sendMessage(wbot, contact, ticket, body);

        return sendOption;
      }

      const body = `\u200e${choosenQueue.greetingMessage}`;
      const send = await sendMessage(wbot, contact, ticket, body);

      // if (choosenQueue.closeTicket) {
      //   await sendMsgAndCloseTicket(wbot, ticket.contact, ticket);
      // }

      return send;
    };

    const botButton = async () => {
      const buttons = [];
      showChatBots.options.forEach((option, index) => {
        buttons.push({
          buttonId: `${index + 1}`,
          buttonText: { displayText: option.name },
          type: 1
        });
      });

      if (buttons.length > 0) {

        const buttonMessage = {
          text: `\u200e${choosenQueue.greetingMessage}`,
          buttons,
          headerType: 1
        };

        const send = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          buttonMessage
        );

        await verifyMessage(send, ticket, contact);

        return send;
      }

      const body = `\u200e${choosenQueue.greetingMessage}`;
      const send = await sendMessage(wbot, contact, ticket, body);

      return send;

    };

    const botList = async () => {
      const sectionsRows = [];
      showChatBots.options.forEach((queue, index) => {
        sectionsRows.push({
          title: queue.name,
          rowId: `${index + 1}`
        });
      });

      if (sectionsRows.length > 0) {
        const sections = [
          {
            title: "Menu",
            rows: sectionsRows
          }
        ];

        const listMessage = {
          text: formatBody(`\u200e${choosenQueue.greetingMessage}`, ticket),
          buttonText: "Escolha uma opção",
          sections
        };

        const sendMsg = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          listMessage
        );

        await verifyMessage(sendMsg, ticket, contact);

        return sendMsg;
      }

      const body = `\u200e${choosenQueue.greetingMessage}`;
      const send = await sendMessage(wbot, contact, ticket, body);

      return send;
    };

    if (typeBot === "text") {
      return await botText();
    }

    if (typeBot === "button" && showChatBots.options.length > 4) {
      return await botText();
    }

    if (typeBot === "button" && showChatBots.options.length <= 4) {
      return await botButton();
    }

    if (typeBot === "list") {
      return await botList();
    }
  }

};

const backToMainMenu = async (
  wbot: Session,
  contact: Contact,
  ticket: Ticket
) => {
  await UpdateTicketService({
    ticketData: { queueId: null, userId: null },
    ticketId: ticket.id,
    companyId: ticket.companyId
  });

  const { queues, greetingMessage, greetingMediaAttachment } = await ShowWhatsAppService(wbot.id!, ticket.companyId);

  const buttonActive = await CompaniesSettings.findOne({
    where: {
      companyId: ticket.companyId
    }
  });

  const botText = async () => {
    let options = "";

    queues.forEach((option, index) => {
      options += `*[ ${index + 1} ]* - ${option.name}\n`;
    });
    options += `\n*[ Sair ]* - Encerrar Atendimento`;


    const body = formatBody(`\u200e${greetingMessage}\n\n${options}`, ticket);

    if (greetingMediaAttachment !== null) {
      const filePath = path.resolve("public", `company${ticket.companyId}`, ticket.whatsapp.greetingMediaAttachment);

      const messagePath = ticket.whatsapp.greetingMediaAttachment
      const optionsMsg = await getMessageOptions(messagePath, filePath, String(ticket.companyId), body);

      const sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

      await verifyMediaMessage(sentMessage, ticket, contact);

    } else {
      await wbot.sendMessage(
        `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        {
          text: body
        }
      );
    }

    const deleteDialog = await DeleteDialogChatBotsServices(contact.id);
    return deleteDialog;
  };

  const botButton = async () => {
    const buttons = [];
    queues.forEach((queue, index) => {
      buttons.push({
        buttonId: `${index + 1}`,
        buttonText: { displayText: queue.name },
        type: 1
      });
    });

    const buttonMessage = {
      text: formatBody(`\u200e${greetingMessage}`, ticket),
      buttons,
      headerType: 1
    };

    const sendMsg = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      buttonMessage
    );

    await verifyMessage(sendMsg, ticket, contact);

    const deleteDialog = await DeleteDialogChatBotsServices(contact.id);
    return deleteDialog;
  };

  const botList = async () => {
    const sectionsRows = [];
    queues.forEach((queue, index) => {
      sectionsRows.push({
        title: queue.name,
        rowId: `${index + 1}`
      });
    });

    const sections = [
      {
        title: "Menu",
        rows: sectionsRows
      }
    ];

    const listMessage = {
      text: formatBody(`\u200e${greetingMessage}`, ticket),
      buttonText: "Escolha uma opção",
      sections
    };

    const sendMsg = await wbot.sendMessage(
      `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      listMessage
    );

    await verifyMessage(sendMsg, ticket, contact);

    const deleteDialog = await DeleteDialogChatBotsServices(contact.id);
    return deleteDialog;
  };

  if (buttonActive.chatBotType === "text") {
    return botText();
  }

  if (buttonActive.chatBotType === "button" && queues.length > 4) {
    return botText();
  }

  if (buttonActive.chatBotType === "button" && queues.length <= 4) {
    return botButton();
  }

  if (buttonActive.chatBotType === "list") {
    return botList();
  }
};

function validaCpfCnpj(val) {
  if (val.length == 11) {
    var cpf = val.trim();

    cpf = cpf.replace(/\./g, '');
    cpf = cpf.replace('-', '');
    cpf = cpf.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cpf.length > i; i++) {
      if (cpf[i - 1] != cpf[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p = 10; (cpf.length - 2) > i; i++, p--) {
      v1 += cpf[i] * p;
    }

    v1 = ((v1 * 10) % 11);

    if (v1 == 10) {
      v1 = 0;
    }

    if (v1 != cpf[9]) {
      return false;
    }

    for (var i = 0, p = 11; (cpf.length - 1) > i; i++, p--) {
      v2 += cpf[i] * p;
    }

    v2 = ((v2 * 10) % 11);

    if (v2 == 10) {
      v2 = 0;
    }

    if (v2 != cpf[10]) {
      return false;
    } else {
      return true;
    }
  } else if (val.length == 14) {
    var cnpj = val.trim();

    cnpj = cnpj.replace(/\./g, '');
    cnpj = cnpj.replace('-', '');
    cnpj = cnpj.replace('/', '');
    cnpj = cnpj.split('');

    var v1 = 0;
    var v2 = 0;
    var aux = false;

    for (var i = 1; cnpj.length > i; i++) {
      if (cnpj[i - 1] != cnpj[i]) {
        aux = true;
      }
    }

    if (aux == false) {
      return false;
    }

    for (var i = 0, p1 = 5, p2 = 13; (cnpj.length - 2) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v1 += cnpj[i] * p1;
      } else {
        v1 += cnpj[i] * p2;
      }
    }

    v1 = (v1 % 11);

    if (v1 < 2) {
      v1 = 0;
    } else {
      v1 = (11 - v1);
    }

    if (v1 != cnpj[12]) {
      return false;
    }

    for (var i = 0, p1 = 6, p2 = 14; (cnpj.length - 1) > i; i++, p1--, p2--) {
      if (p1 >= 2) {
        v2 += cnpj[i] * p1;
      } else {
        v2 += cnpj[i] * p2;
      }
    }

    v2 = (v2 % 11);

    if (v2 < 2) {
      v2 = 0;
    } else {
      v2 = (11 - v2);
    }

    if (v2 != cnpj[13]) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep(time) {
  await timeout(time);
}

function firstDayOfMonth(month) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - month, 1);
  return firstDay;
};

function lastDayOfMonth(month) {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + month, 0);
  return lastDay;
};

function dataAtualFormatada(data) {
  var dia = data.getDate().toString(),
    diaF = (dia.length == 1) ? '0' + dia : dia,
    mes = (data.getMonth() + 1).toString(),
    mesF = (mes.length == 1) ? '0' + mes : mes,
    anoF = data.getFullYear();
  return diaF + "/" + mesF + "/" + anoF;
}

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function formatDate(date) {
  return date.substring(8, 10) + '/' + date.substring(5, 7) + '/' + date.substring(0, 4)
}

function sortfunction(a, b) {
  return a.dueDate.localeCompare(b.dueDate);
}

async function sendMsgAndCloseTicket(wbot, contact, ticket) {

  // const bodyfinaliza = `Estamos finalizando esta conversa! Caso precise entre em contato conosco!`
  // await sleep(2000)
  // await sendMessage(wbot, contact, ticket, bodyfinaliza);

  const ticketUpdateAgent = {
    ticketData: {
      status: "closed",
      userId: ticket?.userId || null,
      sendFarewellMessage: false,
      amountUsedBotQueues: 0
    },
    ticketId: ticket.id,
    companyId: ticket.companyId,
  };

  await sleep(2000)
  await UpdateTicketService(ticketUpdateAgent);
}

export const sayChatbot = async (
  queueId: number,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  msg: proto.IWebMessageInfo
): Promise<any> => {
  // const selectedOption =
  //   msg?.message?.buttonsResponseMessage?.selectedButtonId ||
  //   msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
  //   getBodyMessage(msg);

  const selectedOption =
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
    getBodyMessage(msg);

  if (!queueId && selectedOption && msg.key.fromMe) return;

  const getStageBot = await ShowDialogChatBotsServices(contact.id);


  if (selectedOption.toLocaleLowerCase() === "sair") {
    const ticketUpdateAgent = {
      ticketData: {
        status: "closed",
        amountUsedBotQueues: 0
      },
      ticketId: ticket.id,
      companyId: ticket.companyId
    };
    await UpdateTicketService(ticketUpdateAgent);

    const complationMessage = ticket.whatsapp?.complationMessage;

    const textMessage = {
      text: formatBody(`\u200e${complationMessage}`, ticket),
    };

    if (!isNil(complationMessage)) {
      const sendMsg = await wbot.sendMessage(
        `${ticket?.contact?.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
        textMessage
      );

      await verifyMessage(sendMsg, ticket, ticket.contact);
    }
    await DeleteDialogChatBotsServices(contact.id);
    return;
  }

  if (selectedOption === "#") {
    const backTo = await backToMainMenu(wbot, contact, ticket);
    return;
  }


  if (!getStageBot) {
    const queue = await ShowQueueService(queueId, ticket.companyId);

    const selectedOptions =
      msg?.message?.buttonsResponseMessage?.selectedButtonId ||
      msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
      getBodyMessage(msg);

    const choosenQueue = queue.chatbots[+selectedOptions - 1];

    if (choosenQueue) {
      if (choosenQueue.queueType === "integration") {
        try {

          const ticketUpdateAgent = {
            ticketData: {
              integrationId: choosenQueue.optIntegrationId,
              useIntegration: true,
              status: "pending"
            },
            ticketId: ticket.id
          };
          await UpdateTicketService(
            {
              ticketData: {
                ...ticketUpdateAgent.ticketData,
              },
              ticketId: ticketUpdateAgent.ticketId,
              companyId: ticket.companyId
            }

          );
        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }

      if (choosenQueue.queueType === "queue") {

        try {

          const ticketUpdateAgent = {
            ticketData: {
              queueId: choosenQueue.optQueueId,
              status: "pending"
            },
            ticketId: ticket.id
          };
          await UpdateTicketService(
            {
              ticketData: {
                ...ticketUpdateAgent.ticketData,
              },
              ticketId: ticketUpdateAgent.ticketId,
              companyId: ticket.companyId
            }

          );
        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }

      if (choosenQueue.queueType === "attendent") {
        try {

          const ticketUpdateAgent = {
            ticketData: {
              queueId: choosenQueue.optQueueId,
              userId: choosenQueue.optUserId,
              status: "pending"
            },
            ticketId: ticket.id
          };
          await UpdateTicketService(
            {
              ticketData: {
                ...ticketUpdateAgent.ticketData,
              },
              ticketId: ticketUpdateAgent.ticketId,
              companyId: ticket.companyId
            }

          );
        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }

      await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);

      let send
      if (choosenQueue?.greetingMessage) {
        send = await sendDialog(choosenQueue, wbot, contact, ticket);
      } // nao tem mensagem de boas vindas

      if (choosenQueue.queueType === "file") {
        try {
          const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

          const files = await ShowFileService(choosenQueue.optFileId, ticket.companyId)

          const folder =  path.resolve(publicFolder , `company${ticket.companyId}`,"fileList", String(files.id))

          for (const [index, file] of files.options.entries()) {
            const mediaSrc = {
              fieldname: 'medias',
              originalname: file.path,
              encoding: '7bit',
              mimetype: file.mediaType,
              filename: file.path,
              path: path.resolve(folder,file.path),
            } as Express.Multer.File

            await SendWhatsAppMedia({media: mediaSrc, ticket, body: file.name, isForwarded: false});
          };

        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }
      if (choosenQueue.closeTicket) {
        await sendMsgAndCloseTicket(wbot, ticket.contact, ticket);
      }

      return send;
    }

  }

  if (getStageBot) {
    const selected = isNumeric(selectedOption) ? selectedOption : 1;
    const bots = await ShowChatBotServices(getStageBot.chatbotId);

    const choosenQueue = bots.options[+selected - 1]

    if (choosenQueue) {
      if (!choosenQueue.greetingMessage) {
        await DeleteDialogChatBotsServices(contact.id);
        return;
      } // nao tem mensagem de boas vindas
      if (choosenQueue.isAgent) {

        const getUserByName = await User.findOne({
          where: {
            name: choosenQueue.name
          }
        });
        const ticketUpdateAgent = {
          ticketData: {
            userId: getUserByName.id,
            status: "open"
          },
          ticketId: ticket.id
        };
        await UpdateTicketService(
          {
            ticketData: {
              ...ticketUpdateAgent.ticketData,
            },
            ticketId: ticketUpdateAgent.ticketId,
            companyId: ticket.companyId
          }

        );
      }
      if (choosenQueue.queueType === "integration") {
        try {

          const ticketUpdateAgent = {
            ticketData: {
              integrationId: choosenQueue.optIntegrationId,
              useIntegration: true,
              status: "pending"
            },
            ticketId: ticket.id
          };
          await UpdateTicketService(
            {
              ticketData: {
                ...ticketUpdateAgent.ticketData,
              },
              ticketId: ticketUpdateAgent.ticketId,
              companyId: ticket.companyId
            }

          );
        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }

      if (choosenQueue.queueType === "queue") {

        try {

          const ticketUpdateAgent = {
            ticketData: {
              queueId: choosenQueue.optQueueId,
              status: "pending"
            },
            ticketId: ticket.id
          };
          await UpdateTicketService(
            {
              ticketData: {
                ...ticketUpdateAgent.ticketData,
              },
              ticketId: ticketUpdateAgent.ticketId,
              companyId: ticket.companyId
            }

          );
        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }

      if (choosenQueue.queueType === "attendent") {
        try {

          const ticketUpdateAgent = {
            ticketData: {
              queueId: choosenQueue.optQueueId,
              userId: choosenQueue.optUserId,
              status: "pending"
            },
            ticketId: ticket.id
          };
          await UpdateTicketService(
            {
              ticketData: {
                ...ticketUpdateAgent.ticketData,
              },
              ticketId: ticketUpdateAgent.ticketId,
              companyId: ticket.companyId
            }

          );
        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }

      if (choosenQueue.queueType === "file") {
        try {
          const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

          const files = await ShowFileService(choosenQueue.optFileId, ticket.companyId)

          const folder =  path.resolve(publicFolder , `company${ticket.companyId}`,"fileList", String(files.id))

          for (const [index, file] of files.options.entries()) {
            const mediaSrc = {
              fieldname: 'medias',
              originalname: file.path,
              encoding: '7bit',
              mimetype: file.mediaType,
              filename: file.path,
              path: path.resolve(folder,file.path),
            } as Express.Multer.File

            await SendWhatsAppMedia({media: mediaSrc, ticket, body: file.name, isForwarded: false});
          };

        } catch (error) {
          await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
        }
      }
      await deleteAndCreateDialogStage(contact, choosenQueue.id, ticket);
      const send = await sendDialog(choosenQueue, wbot, contact, ticket);
      return send;
    }
  }

};
