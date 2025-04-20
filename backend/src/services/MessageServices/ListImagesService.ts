import Message from "../../models/Message";

interface Request {
  ticketId: string;
}

interface Response {
  images: {
    mediaUrl: string,
    mediaType: string,
    pageNumber: number,
    body: string
  }[];
}

const ListImagesService = async ({
  ticketId,
}: Request): Promise<Response> => {

  const { rows: messages } = await Message.findAndCountAll({
    where: {
      ticketId,
    },
    order: [["createdAt", "DESC"]]
  });

  // Find the index of the row that matches a criterion

  const images = messages.filter(message =>
    message.mediaType === "image"
  );

  const media = images.map((message) => ({
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    pageNumber: Math.ceil((messages.indexOf(message) + 1) / 20),
    body: message.mediaUrl
  }));

  return {
    images: media.reverse(),
  }
};

export default ListImagesService;
