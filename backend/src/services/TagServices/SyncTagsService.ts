//Corrigido por Pedro Figueiredo para a comunidade EquipeChat
import Tag from "../../models/Tag";
import ContactTag from "../../models/ContactTag";
import TicketTag from '../../models/TicketTag';

interface Request {
  tags: Tag[]; // Lista de tags para sincronizar
  contactId: number; // ID do contato associado
  ticketId: number; // ID do ticket associado
}

const SyncTags = async ({
  tags,
  contactId,
  ticketId,
}: Request): Promise<Tag[] | null> => {
  // Filtra tags associadas ao contato (kanban === 0)
  let contactTagList = [];
  let ticketTagList = [];
  contactTagList = tags
    .filter(tag => tag.kanban === 0)
    .map(tag => ({ tagId: tag.id, contactId }));

  // Filtra tags associadas ao ticket (kanban === 1)
  ticketTagList = tags
    .filter(tag => tag.kanban === 1)
    .map(tag => ({ tagId: tag.id, ticketId }));

  // Sincroniza tags do contato
  if ( contactTagList && (contactTagList?.length > 0)) {
    // Remove todas as tags antigas associadas ao contato
    await ContactTag.destroy({ where: { contactId } });
    // Adiciona as novas tags ao contato
    await ContactTag.bulkCreate(contactTagList);
  } else {
    // Se nenhuma tag foi passada, remove todas as tags do contato
    await ContactTag.destroy({ where: { contactId } });
  }

  if(ticketId){
    // Sincroniza tags do ticket
    if ( ticketTagList && (ticketTagList.length > 0)) {
      // Remove todas as tags antigas associadas ao ticket
      await TicketTag.destroy({ where: { ticketId } });
      // Adiciona as novas tags ao ticket
      await TicketTag.bulkCreate(ticketTagList);
    } else {
      // Se nenhuma tag foi passada, remove todas as tags do ticket
      await TicketTag.destroy({ where: { ticketId } });
    }
  }

  return tags; // Retorna as tags sincronizadas
};

export default SyncTags;
