import { col, fn, literal, Op } from "sequelize";
import Plantao from "../../models/Plantao";
import Whatsapp from "../../models/Whatsapp";
import { getWbot } from "../../libs/wbot";
import Ticket from "../../models/Ticket";

export const NotifyPlantaoService = async ({ companyId, ticket }): Promise<void> => {

  const now = new Date();
  const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const today = now.toLocaleDateString('en-US', { weekday: 'long' });

  const plantonistas = await Plantao.findAll({
    where: {
      companyId,
      [Op.and]: [
        literal(`EXISTS (
          SELECT 1
          FROM jsonb_array_elements(days) AS elem
          WHERE elem->>'weekdayEn' = '${today}'
            AND elem->>'startTime' IS NOT NULL
            AND elem->>'endTime' IS NOT NULL
        )`)
      ]
    }
  });

  plantonistas.forEach(plantao => {
    const days = plantao.days;
    // @ts-ignore
    const currentDay = days.find(day => day.weekdayEn === today);
    // @ts-ignore
    const startTime = currentDay.startTime;
    // @ts-ignore
    const endTime = currentDay.endTime;

    if (currentTime >= startTime && currentTime <= endTime) {
      handleNotifyPlantao(companyId, plantao.phone, ticket, plantao.interval);
    }
  });


}


const handleNotifyPlantao = async (companyId: string, fone: string, ticket: Ticket, interval: number) => {

  try {
    let wpp = await Whatsapp.findOne({
      where: {
        companyId,
        isDefault: true
      }
    });

    if (!wpp) {
      wpp = await Whatsapp.findOne({
        where: {
          companyId,
          status: 'CONNECTED'
        }
      });
    }

    const wbot = getWbot(wpp.id);

    const [validNumber] = await wbot.onWhatsApp(`${fone}@s.whatsapp.net`);

    const contactName = ticket.contact.name;
    const contactNumber = ticket.contact.number;


    const msg = ` Novo atendimento aguardando sua resposta: \n Nome: *${contactName}* \n Telefone: *${contactNumber}*`

    const body = `\u200e${msg}`;

    wbot.sendMessage(validNumber.jid, {
      text: body
    });

    const now = new Date();
    now.setMinutes(now.getMinutes() + interval);

    ticket.update({ nextNotify: now });

  } catch (error) {
    console.log('Error NotifyPlantaoService', error);

  }



};
