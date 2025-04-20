import Message from "../../models/Message";
import { Op, fn, col, where } from "sequelize";

interface Request {
  ticketId: string;
}

interface Response {
  media: { mediaUrl: string; mediaType: string; }[];
  documents: {
    url: string,
    pageNumber: number,
    body: string
  }[];
  links: {
    url: string,
    pageNumber: number,
    body: string
  }[];
  calls: any[];
}

const ListAllMediaService = async ({
  ticketId,
}: Request): Promise<Response> => {

  const { rows: media } = await Message.findAndCountAll({
    where: {
      ticketId,
      [Op.or]: [
        { mediaType: "image" },
        { mediaType: "video" },

      ],
    },
    order: [["createdAt", "DESC"]]
  });

  const mediaData = media.map((message) => ({
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
  }));


  const { rows: messages } = await Message.findAndCountAll({
    where: {
      ticketId,
    },
    order: [["createdAt", "DESC"]]
  });

  const documents = messages.filter(message =>
    message.mediaType === "application" || (message.mediaUrl && message.mediaUrl.indexOf('.xml') != -1)
  );

  const documentsData = documents.map((message) => ({
    url: message.mediaUrl,
    pageNumber: Math.ceil((messages.indexOf(message) + 1) / 20),
    body: message.mediaUrl
  }));

  const urls = messages.filter(message => {
    return (
      (/https?:\/\/\S+/i.test(message.body) ||
        /http?:\/\/\S+/i.test(message.body)) && message.mediaType != 'locationMessage'
    );
  });

  const linksData = urls.map((message, index) => {
    const matches = message.body.match(/https?:\/\/\S+/ig) || message.body.match(/http?:\/\/\S+/ig); // Capture both http and https URLs
    const urls = matches ? matches : [];
    return urls.map((url) => ({
      url,
      pageNumber: Math.ceil((messages.indexOf(message) + 1) / 20),
      body: message.body,
    }));
  }).flat();

  const { rows: calls } = await Message.findAndCountAll({
    where: {
      ticketId,
      [Op.or]: [
        { mediaType: "call_log" }
      ],
    },
    order: [["createdAt", "DESC"]]
  });






  return {
    media: mediaData,
    documents: documentsData,
    links: linksData,
    calls: calls
  }
};

export default ListAllMediaService;
