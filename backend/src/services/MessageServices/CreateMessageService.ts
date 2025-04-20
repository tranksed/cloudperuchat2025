import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

interface MessageData {
  wid: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
  channel?: string;
  ticketTrakingId?: number;
  isPrivate?: boolean;
  ticketImported?: any;
  isForwarded?: boolean;
}
interface Request {
  messageData: MessageData;
  companyId: number;
}

const CreateMessageService = async ({
  messageData,
  companyId
}: Request): Promise<Message> => {
  await Message.upsert({ ...messageData, companyId });

  const message = await Message.findOne({
    where: {
      wid: messageData.wid,
      companyId
    }, 
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: ["contact", "queue", "whatsapp"]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ]
  });

  if (message.ticket.queueId !== null && message.queueId === null) {
    await message.update({ queueId: message.ticket.queueId });
  }

  if (message.isPrivate) {
   await message.update({wid: `PVT${message.id}`});
  }
 
  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }
  
  const io = getIO();

  if(!messageData?.ticketImported){
    io.to(message.ticketId.toString())
    .to(message.ticket.status)
    .to("notification")
    .emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });
  }


  return message;
};

export default CreateMessageService;
