import Whatsapp from "../models/Whatsapp";
import GetWhatsappWbot from "./GetWhatsappWbot";
import fs from "fs";

import { getMessageOptions } from "../services/WbotServices/SendWhatsAppMedia";

export type MessageData = {
  number: number | string;
  body: string;
  mediaPath?: string;
  companyId?: number;
};

export const SendMessage = async (
  whatsapp: Whatsapp,
  messageData: MessageData,
  ignoreMessage = true
): Promise<any> => {
  try {
    const wbot = await GetWhatsappWbot(whatsapp);
    const chatId = `${messageData.number}@s.whatsapp.net`;
    const companyId = messageData?.companyId ? messageData.companyId.toString(): null;

    let message;
    let body;
    if (messageData.mediaPath) {
      const options = await getMessageOptions(
        messageData.body,
        messageData.mediaPath,
        companyId
      );
      if (options) {
        body = fs.readFileSync(messageData.mediaPath);
        message = await wbot.sendMessage(chatId, {
          ...options
        });
      }
    } else {

      if(ignoreMessage){
        console.log("aqui");

        body = `\u200e${messageData.body}`;
      }else{
        body = `${messageData.body}`;
      }
      message = await wbot.sendMessage(chatId, { text: body });
    }

    return message;
  } catch (err: any) {
    throw new Error(err);
  }
};
