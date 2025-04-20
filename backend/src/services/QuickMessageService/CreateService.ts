import * as Yup from "yup";
import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";

interface Data {
  shortcode: string;
  message: string;
  companyId: number | string;
  userId: number | string;
  geral: boolean;
  isMedia: boolean;
  mediaPath?: string | null;
  isCategory?: boolean;
  categoryId?: number | string | null;
}

const CreateService = async (data: Data): Promise<QuickMessage> => {
  const { shortcode, message, isMedia, isCategory } = data;
  let ticketnoteSchema = null;

  if (!isCategory) {
    ticketnoteSchema = Yup.object().shape({
      shortcode: Yup.string()
        .min(3, "ERR_QUICKMESSAGE_INVALID_NAME")
        .required("ERR_QUICKMESSAGE_REQUIRED"),
      message: isMedia ? Yup.string().notRequired() : Yup.string()
      .min(3, "ERR_QUICKMESSAGE_INVALID_NAME")
      .required("ERR_QUICKMESSAGE_REQUIRED")
    });
  } else {
    ticketnoteSchema = Yup.object().shape({
      shortcode: Yup.string()
        .min(3, "ERR_QUICKMESSAGE_INVALID_NAME")
        .required("ERR_QUICKMESSAGE_REQUIRED")
    });
  }

  try {
    await ticketnoteSchema.validate({ shortcode, message });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (data.categoryId == '') {
    data.categoryId = null;
  }

  const record = await QuickMessage.create(data);

  return record;
};

export default CreateService;
