import { WAMessage, AnyMessageContent } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import fs, { unlink, unlinkSync } from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Ticket from "../../models/Ticket";
import mime from "mime-types";
import Contact from "../../models/Contact";
import { getWbot } from "../../libs/wbot";
import CreateMessageService from "../MessageServices/CreateMessageService";
import formatBody from "../../helpers/Mustache";
import Message from '../../models/Message';
interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  companyId?: number;
  body?: string;
  isPrivate?: boolean;
  isForwarded?: boolean;
  quotedMsgId?: number | string;
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = path.join(publicFolder, `company${companyId}`,`${new Date().getTime()}.mp3`);

  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i "${audio}" -vn -ab 128k -ar 44100 -f ipod ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        // fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

const processAudioFile = async (audio: string, companyId: string): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i "${audio}" -vn -ar 44100 -ac 2 -b:a 192k "${outputAudio}"`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        // fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

export const getMessageOptions = async (
  fileName: string,
  pathMedia: string,
  companyId?: string,
  body?: string
): Promise<any> => {
  const mimeType = mime.lookup(pathMedia);
  const typeMessage = mimeType.split("/")[0];


  try {
    if (!mimeType) {
      throw new Error("Invalid mimetype");
    }
    let options: AnyMessageContent;

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: body ? body: null,
        fileName: fileName
        // gifPlayback: true
      };
    } else if (typeMessage === "audio") {
      const typeAudio = true; //fileName.includes("audio-record-site");
      const convert = await processAudio(pathMedia, companyId);

      if (typeAudio) {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: "audio/mp4",
          ptt: true
        };
      } else {
        options = {
          audio: fs.readFileSync(convert),
          mimetype: typeAudio ? "audio/mp4" : mimeType,
          ptt: true
        };
      }
    } else if (typeMessage === "document") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body: null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: body ? body: null,
        fileName: fileName,
        mimetype: mimeType
      };
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body ? body: fileName,
      };
    }

    return options;
  } catch (e) {
    Sentry.captureException(e);
    console.log(e);
    return null;
  }
};

const SendWhatsAppMedia = async ({
  media,
  ticket,
  body,
  isPrivate,
  isForwarded = false,
  quotedMsgId,
}: Request): Promise<WAMessage> => {
  try {
    const wbot = await getWbot(ticket.whatsappId);
    const companyId = ticket.companyId.toString()

    const pathMedia = media.path;
    const typeMessage = media.mimetype.split("/")[0];
    let options: AnyMessageContent;
    let bodyTicket = "";
    let quotedTemp = {};
    const bodyMedia = formatBody(body,ticket);

    if (typeMessage === "video") {
      options = {
        video: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
        // gifPlayback: true
      };
      bodyTicket = "🎥 Arquivo de vídeo"
    } else if (typeMessage === "audio") {
      const typeAudio = true; //media.originalname.includes("audio-record-site");
      if (typeAudio) {
        const convert = await processAudio(media.path, companyId);
        options = {
          audio: fs.readFileSync(convert),
          mimetype: typeAudio ? "audio/mp4" : media.mimetype,
          ptt: true,
          caption: bodyMedia,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
        };
        unlinkSync(convert);
      } else {
        const convert = await processAudio(media.path, companyId);
        options = {
          audio: fs.readFileSync(convert),
          mimetype:  "audio/mp4",
          ptt: true,
          caption: bodyMedia,
          contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
        };
        unlinkSync(convert);
      }
      bodyTicket = "🎵 Arquivo de áudio"
    } else if (typeMessage === "document" || typeMessage === "text") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        mimetype: media.mimetype,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "📂 Documento"
    } else if (typeMessage === "application") {
      options = {
        document: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        fileName: media.originalname.replace('/', '-'),
        mimetype: media.mimetype,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "📎 Outros anexos"
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: bodyMedia,
        contextInfo: { forwardingScore: isForwarded ? 2 : 0, isForwarded: isForwarded },
      };
      bodyTicket = "📎 Outros anexos"
    }

    if (quotedMsgId) {

      const chatMessages = await Message.findOne({
        where: {
          id: quotedMsgId
        }
      });



      if (chatMessages) {
        const msgFound = JSON.parse(chatMessages.dataJson);

          quotedTemp = {
            quoted: {
              key: msgFound.key,
              message: msgFound.message
            },
          };
      }
    }
    if (isPrivate) {
      const messageData = {
        wid: `PVT${companyId}${ticket.id}${body.substring(0,6)}`,
        ticketId: ticket.id,
        contactId: undefined,
        body: bodyMedia,
        fromMe: true,
        mediaUrl: media.filename,
        mediaType: media.mimetype.split("/")[0],
        read: true,
        quotedMsgId,
        ack: 2,
        remoteJid: null,
        participant: null,
        dataJson: null,
        ticketTrakingId: null,
        isPrivate
      };

      await CreateMessageService({ messageData, companyId: ticket.companyId});

      return
    }


    const contactNumber = await Contact.findByPk(ticket.contactId)

    let number: string;

    if (contactNumber.remoteJid && contactNumber.remoteJid !== "" && contactNumber.remoteJid.includes("@")) {
      number = contactNumber.remoteJid;
    } else {
      number = `${contactNumber.number}@${
        ticket.isGroup ? "g.us" : "s.whatsapp.net"
      }`;
    }

    const sentMessage = await wbot.sendMessage(
      number,
      {
        ...options
      },
      {
        ...quotedTemp
      }
    );

    await ticket.update({ lastMessage: formatBody(body !== media.filename ? formatBody(body,ticket) : bodyMedia, ticket), imported:null });

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMedia;
