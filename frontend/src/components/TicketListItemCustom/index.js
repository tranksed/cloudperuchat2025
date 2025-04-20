import React, { useState, useEffect, useRef, useContext } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay, differenceInHours, isYesterday, differenceInMinutes } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green, grey } from "@material-ui/core/colors";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import Typography from "@material-ui/core/Typography";
import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import Badge from "@material-ui/core/Badge";
import SupportAgentIcon from '@mui/icons-material/SupportAgent'; // icone atendente
import StyleIcon from '@mui/icons-material/Style'; // icone fila
import BookmarksIcon from '@mui/icons-material/Bookmarks'; // icone tag
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'; //icone kanban

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { Box, Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import GroupIcon from '@material-ui/icons/Group';
import ConnectionIcon from "../ConnectionIcon";
import AcceptTicketWithouSelectQueue from "../AcceptTicketWithoutQueueModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ShowTicketOpen from "../ShowTicketOpenModal";
import { isNil } from "lodash";
import { toast } from "react-toastify";
import { Done, HighlightOff, Replay, SwapHoriz } from "@material-ui/icons";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { Chip, Stack } from "@mui/material";

const useStyles = makeStyles((theme) => ({
    ticket: {
        position: "relative",
        height: 90,
        paddingHorizontal: 10,
        paddingVertical: 0,
        borderRadius: "10px",
        backgroundColor: theme.palette.type === "dark" ? "transparent" : "#fff", // Modo noturno
        boxShadow: theme.palette.type === "dark" ? "3px 3px 5px rgba(51, 51, 51, 0.1)" : "0px 2px 5px rgba(0, 0, 0, 0.1)", // Modo noturno
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out", // Ajuste aqui para uma transição mais suave
        "&:hover": {
            transform: "translateY(-1.5px)",
            boxShadow: theme.palette.type === "dark" ? "0px 4px 10px rgba(255, 255, 255, 0.0)" : "0px 4px 10px rgba(0, 0, 0, 0.0)", // Modo noturno
            backgroundColor: theme.palette.type === "dark" ? "#333" : "#F4F4F4", // Cor de fundo hover no modo escuro
        },
        marginBottom: "3px",
    },

    pendingTicket: {
        cursor: "unset",
    },

    newMessagesCount: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        top: 5,
        color: "green",
        fontWeight: "bold",
        marginRight: "-19px",
        borderRadius: 0,
    },

    contactNameWrapper: {
        display: "flex", // Para alinhar os elementos em linha
        alignItems: "center", // Para alinhar o ícone e o nome verticalmente no centro
        justifyContent: "flex-start", // Para garantir que os itens fiquem alinhados à esquerda
        marginLeft: "5px",
        gap: "10px", // Adiciona um espaço entre o ícone e o nome, se necessário
    },

    lastMessageTime: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        marginRight: "1px"
    },

    lastMessageTimeUnread: {
        justifySelf: "flex-end",
        textAlign: "right",
        position: "relative",
        color: "green",
        fontWeight: "bold",
        marginRight: "1px",
    },

    closedBadge: {
        alignSelf: "center",
        justifySelf: "flex-end",
        marginRight: 32,
        marginLeft: "auto",
    },

    contactLastMessage: {
        paddingRight: "0%",
        marginLeft: "5px",
    },

    contactLastMessageUnread: {
        paddingRight: 20,
        fontWeight: "bold",
        color: theme.mode === 'light' ? "black" : "white",
        width: "50%"
    },

    badgeStyle: {
        position: "flex", // Garante que o ícone fique fixo no contêiner pai
        top: "1px", // Ajuste o valor conforme necessário
        right: "-9.5px", // Ajuste o valor conforme necessário
        color: "white",
        backgroundColor: green[500],
        borderRadius: "50%", // Faz o badge redondo (se for um ícone de badge)
        padding: "5px", // Ajuste o padding conforme necessário
    },

    acceptButton: {
        position: "absolute",
        right: "1px",
    },

    secondaryContentSecond: {
        display: 'flex',
        alignItems: "flex-start",
        flexWrap: "nowrap",
        flexDirection: "row",
        alignContent: "flex-start",
    },
    ticketInfo1: {
        position: "relative",
        top: 13,
        right: 0
    },
    Radiusdot: {
        "& .MuiBadge-badge": {
            borderRadius: 2,
            position: "inherit",
            height: 16,
            margin: 2,
            padding: 3
        },
        "& .MuiBadge-anchorOriginTopRightRectangle": {
            transform: "scale(1) translate(0%, -40%)",
        },

    },
    connectionIcon: {
        marginRight: theme.spacing(1)
    },

    presence: {
        color: theme?.mode === 'light' ? "green" : "lightgreen",
        fontWeight: "bold",
    }
}));

const TicketListItemCustom = ({ ticket }) => {
    const classes = useStyles();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [ticketUser, setTicketUser] = useState(null);
    const [tag, setTag] = useState([]);

    const [whatsAppName, setWhatsAppName] = useState(null);
    const [acceptTicketWithouSelectQueueOpen, setAcceptTicketWithouSelectQueueOpen] = useState(false);
    const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);

    const presenceMessage = { composing: "Digitando...", recording: "Gravando..." };

    const [openAlert, setOpenAlert] = useState(false);
    const [userTicketOpen, setUserTicketOpen] = useState("");
    const [queueTicketOpen, setQueueTicketOpen] = useState("");

    const { ticketId } = useParams();
    const isMounted = useRef(true);
    const { setCurrentTicket } = useContext(TicketsContext);
    const { user } = useContext(AuthContext);


    const { get: getSetting } = useCompanySettings();

    useEffect(() => {
        if (ticket.userId && ticket.user) {
            setTicketUser(ticket?.user?.name.toUpperCase());
        }

        setWhatsAppName(ticket?.whatsapp?.name);

        setTag(ticket?.tags);

        return () => {
            isMounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenAcceptTicketWithouSelectQueue = React.useCallback(() => {

        setAcceptTicketWithouSelectQueueOpen(true);
    }, []);

    const handleCloseTicket = async (id) => {
        const setting = await getSetting(
            {
                "column": "requiredTag"
            }
        );

        if (setting.requiredTag === "enabled") {
            //verificar se tem uma tag   
            try {
                const contactTags = await api.get(`/contactTags/${ticket.contact.id}`);
                if (!contactTags.data.tags) {
                    toast.warning(i18n.t("messagesList.header.buttons.requiredTag"))
                } else {
                    await api.put(`/tickets/${id}`, {
                        status: "closed",
                        userId: user?.id || null,
                        promptId: null,
                    });

                    if (isMounted.current) {
                        setLoading(false);
                    }
                    history.push(`/tickets/`);
                }
            } catch (err) {
                setLoading(false);
                toastError(err);
            }
        } else {
            setLoading(true);
            try {
                await api.put(`/tickets/${id}`, {
                    status: "closed",
                    userId: user?.id || null,
                });

            } catch (err) {
                setLoading(false);
                toastError(err);
            }
            if (isMounted.current) {
                setLoading(false);
            }
            history.push(`/tickets/`);
        }

    };

    const handleCloseIgnoreTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "closed",
                userId: user?.id || null,
                sendFarewellMessage: false,
                amountUsedBotQueues: 0
            });

        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/`);
    };

    const truncate = (str, len) => {
        if (!isNil(str)) {
            if (str.length > len) {
                return str.substring(0, len) + "...";
            }
            return str;
        }
    };

    const handleCloseTransferTicketModal = React.useCallback(() => {
        if (isMounted.current) {
            setTransferTicketModalOpen(false);
        }
    }, []);

    const handleOpenTransferModal = React.useCallback(() => {
        setLoading(true)
        setTransferTicketModalOpen(true);
        if (isMounted.current) {
            setLoading(false);
        }
        history.push(`/tickets/${ticket.uuid}`);
    }, [ticket.uuid])

    const handleAcepptTicket = async (id) => {
        setLoading(true);
        try {
            const otherTicket = await api.put(`/tickets/${id}`, {
                status: ticket.isGroup && ticket.channel === 'whatsapp' ? "group" : "open",
                userId: user?.id,
            });

            if (otherTicket.data.id !== ticket.id) {
                if (otherTicket.data.userId !== user?.id) {
                    setOpenAlert(true)
                    setUserTicketOpen(otherTicket.data.user.name)
                    setQueueTicketOpen(otherTicket.data.queue.name)
                } else {
                    setLoading(false);

                    history.push(`/tickets/${otherTicket.data.uuid}`);
                }
            } else {
                let setting;

                try {
                    setting = await getSetting({
                        "column": "sendGreetingAccepted"
                    })
                } catch (err) {
                    toastError(err);
                }

                if (setting.sendGreetingAccepted === "enabled" && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")) {
                    handleSendMessage(ticket.id);
                }
                if (isMounted.current) {
                    setLoading(false);
                }

                history.push(`/tickets/${ticket.uuid}`);
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }

    };

    const renderTime = () => {
        return (
            <Badge className={`${classes.lastBadge} ${classes.leftAligned}`} title={i18n.t("Último Contato")}>
                <span className={classes.redText}>
                    {isYesterday(parseISO(ticket?.updatedAt)) || differenceInHours(new Date(), parseISO(ticket?.updatedAt)) >= 24 ? (
                        "Ontem"
                    ) : (
                        `Há ${differenceInMinutes(new Date(), parseISO(ticket?.updatedAt)) >= 60
                            ? differenceInHours(new Date(), parseISO(ticket?.updatedAt))
                            : differenceInMinutes(new Date(), parseISO(ticket?.updatedAt))
                        } ${differenceInMinutes(new Date(), parseISO(ticket?.updatedAt)) >= 60
                            ? "horas"
                            : "minutos"
                        }`
                    )}
                </span>
            </Badge>
        )
    }



    const handleSendMessage = async (id) => {
        const msg = `{{ms}} *{{name}}*, ${i18n.t("mainDrawer.appBar.user.myName")} *${user?.name}* ${i18n.t("mainDrawer.appBar.user.continuity")}.`;
        const message = {
            read: 1,
            fromMe: true,
            mediaUrl: "",
            body: `*${i18n.t("mainDrawer.appBar.user.virtualAssistant")}:*\n${msg.trim()}`,
        };
        try {
            await api.post(`/messages/${id}`, message);
        } catch (err) {
            toastError(err);
        }
    };

    const handleCloseAlert = React.useCallback(() => {
        setOpenAlert(false);
        setLoading(false);
    }, []);

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setCurrentTicket({ id, uuid, code });
    };

    return (
        <React.Fragment key={ticket.id}>
            <ShowTicketOpen
                isOpen={openAlert}
                handleClose={handleCloseAlert}
                user={userTicketOpen}
                queue={queueTicketOpen}
            />
            <AcceptTicketWithouSelectQueue
                modalOpen={acceptTicketWithouSelectQueueOpen}
                onClose={(e) => setAcceptTicketWithouSelectQueueOpen(false)}
                ticketId={ticket.id}
                ticket={ticket}
            />
            <TransferTicketModalCustom
                modalOpen={transferTicketModalOpen}
                onClose={handleCloseTransferTicketModal}
                ticketid={ticket.id}
                ticket={ticket}
            />

            <ListItem dense button
                onClick={(e) => {
                    handleSelectTicket(ticket);
                }}
                selected={ticketId && ticketId === ticket.uuid}
                className={clsx(classes.ticket, {
                    [classes.pendingTicket]: ticket.status === "pending",
                })}
            >

                <ListItemAvatar
                    style={{ marginLeft: "-10px" }}
                >
                    <Badge
                        className={classes.newMessagesCount}
                        badgeContent={ticket.unreadMessages}
                        classes={{
                            badge: classes.badgeStyle,
                        }}
                    />
                    <Avatar
                        style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            top: "-10px",
                        }}
                        src={`${ticket?.contact?.profilePicUrl}`}

                    />
                </ListItemAvatar>
                <ListItemText
                    disableTypography
                    primary={
                        <span className={classes.contactNameWrapper}>
                            <Typography
                                noWrap
                                component="span"
                                variant="body2"
                                color="textPrimary"
                            >
                                {ticket.isGroup && ticket.channel === "whatsapp" && (
                                    <GroupIcon
                                        fontSize="small"
                                        style={{ color: grey[700], marginBottom: "-1px", marginLeft: "5px" }}
                                    />
                                )} &nbsp;

                                {/* MOTRSTA O NOME DA CONEXÃO AO PASSAR O MOUSE */}
                                {ticket.channel && (
                                    <Tooltip title={whatsAppName || "Carregando..."} arrow>
                                        <div style={{ display: "inline-flex", alignItems: "center" }}>
                                            <ConnectionIcon
                                                width="20"
                                                height="20"
                                                className={classes.connectionIcon}
                                                connectionType={ticket.channel}
                                            />
                                        </div>
                                    </Tooltip>
                                )} &nbsp;
                                {/* MOTRSTA O NOME DA CONEXÃO AO PASSAR O MOUSE */}


                                {truncate(ticket.contact?.name, 30)}
                            </Typography>
                        </span>
                    }
                    secondary={
                        <span className={classes.contactNameWrapper}>

                            <Typography
                                className={Number(ticket.unreadMessages) > 0 ? classes.contactLastMessageUnread : classes.contactLastMessage}
                                noWrap
                                component="span"
                                variant="body2"
                                color="textSecondary"

                            >
                                {["composing", "recording"].includes(ticket?.presence) ? (
                                    <span className={classes.presence}>
                                        {presenceMessage[ticket.presence]}
                                    </span>
                                ) :
                                    <>
                                        {ticket.lastMessage ? (
                                            <>
                                                {ticket.lastMessage.includes('data:image/png;base64') ? <MarkdownWrapper>Localização</MarkdownWrapper> :

                                                    <> {ticket.lastMessage.includes('BEGIN:VCARD') ?
                                                        <MarkdownWrapper>Contato</MarkdownWrapper> :
                                                        <MarkdownWrapper>{truncate(ticket.lastMessage, 30)}</MarkdownWrapper>}
                                                    </>
                                                }
                                            </>
                                        ) : (
                                            <br />
                                        )}

                                    </>
                                }

                                <Stack direction="row" spacing={0.5} mt={0}>
                                    {ticketUser && (
                                        <Chip
                                            sx={{
                                                mt: 1,
                                                fontSize: "0.65rem", // Tamanho da fonte do texto dentro do Chip. 0.65rem reduz um pouco o tamanho da fonte.
                                                height: "18px", // Altura do Chip, mantendo o Chip mais compacto.
                                                padding: "5 5px", // Padding interno. Aqui não tem padding lateral.
                                                color: "black", // Cor da letra do Chip. O texto será sempre preto.
                                                fontWeight: "bold", // Garantir que o texto fique em negrito
                                                '& .MuiChip-avatar': { // Estilo específico para o avatar (ícone) dentro do Chip.
                                                    width: "16px", // Largura do ícone
                                                    height: "16px", // Altura do ícone
                                                    fontSize: "15px", // Tamanho do ícone
                                                    color: 'black', // Cor do ícone (aqui está definida como preto)
                                                },
                                            }}
                                            avatar={<SupportAgentIcon />} // O ícone será automaticamente estilizado com base nas regras do sx acima
                                            label={ticketUser}
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                    <Chip
                                        sx={{
                                            mt: 1,
                                            fontSize: "0.65rem", // Tamanho da fonte do texto dentro do Chip (menor, como no anterior)
                                            backgroundColor: ticket.queue?.color || "#ffffff", // Cor de fundo do Chip. Se não houver cor definida para a fila, usa um branco padrão
                                            height: "18px", // Altura do Chip (menor, 20px)
                                            padding: "0 0px", // Padding interno ajustado para 0 nos lados
                                            color: "black", // Cor do texto dentro do Chip
                                            fontWeight: "bold", // Garantir que o texto fique em negrito
                                            '& .MuiChip-avatar': { // Estilo para o avatar (ícone)
                                                width: "16px", // Largura do ícone
                                                height: "16px", // Altura do ícone
                                                fontSize: "16px", // Tamanho do ícone
                                                color: 'black', // Cor do ícone (preto)
                                            },
                                        }}
                                        avatar={<BookmarksIcon />} // O ícone será estilizado automaticamente com base nas regras do sx acima
                                        label={ticket.queue?.name.toUpperCase() || "SEM FILA"} // Texto da fila
                                        variant="outlined"
                                        size="small"
                                    />
                                </Stack>

                                {/* Renderização das tags em uma nova linha */}
                                <Stack direction="row" spacing={0.5} mt={0.5}>
                                    {ticket.contact?.tags?.map(tag => (
                                        <Chip
                                            key={`ticket-contact-tag-${ticket.id}-${tag.id}`}
                                            sx={{
                                                mt: 1,
                                                fontSize: "0.65rem", // Tamanho da fonte do texto, igual ao dos Chips anteriores.
                                                height: "16px", // Altura do Chip, mais compacta.
                                                padding: "0 0px", // Ajuste do padding para não ter espaço nas laterais.
                                                backgroundColor: tag.color || "#ffffff", // Cor de fundo da tag, ou branco se não houver cor.
                                                color: "white", // Cor do texto dentro do Chip. Sempre branco.
                                                fontWeight: "bold", // Garantir que o texto fique em negrito
                                                '& .MuiChip-avatar': { // Estilo para o ícone dentro do Chip (caso tenha).
                                                    width: "16px", // Largura do ícone.
                                                    height: "16px", // Altura do ícone.
                                                    fontSize: "16px", // Tamanho do ícone.
                                                    color: "black", // Cor do ícone (sempre branco).
                                                },
                                            }}
                                            avatar={<StyleIcon />}
                                            label={tag.name} // Nome da tag (de um contato), que é mostrado como o texto.
                                            variant="filled" // Usando o variant "filled" para exibir a cor de fundo.
                                            size="small"
                                        />
                                    ))}
                                    {tag?.map(tagItem => (
                                        <Chip
                                            key={`ticket-tag-${tagItem.id}`}
                                            sx={{
                                                mt: 1,
                                                fontSize: "0.65rem", // Tamanho da fonte do texto dentro do Chip.
                                                height: "16px", // Altura do Chip.
                                                padding: "0 0px", // Padding interno ajustado.
                                                backgroundColor: tagItem.color || "#ffffff", // Cor de fundo baseada na tag.
                                                color: "black", // Texto sempre preto.
                                                fontWeight: "bold", // Garantir texto em negrito.
                                                '& .MuiChip-avatar': { // Estilo para o ícone dentro do Chip (caso tenha).
                                                    width: "16px", // Largura do ícone.
                                                    height: "16px", // Altura do ícone.
                                                    fontSize: "16px", // Tamanho do ícone.
                                                    color: "black", // Cor do ícone (sempre branco).
                                                },
                                            }}
                                            avatar={<ViewKanbanIcon />}
                                            label={tagItem.name} // Nome da tag a ser exibido.
                                            variant="outlined" // Usando o variant "outlined" para consistência.
                                            size="small"
                                        />
                                    ))}
                                </Stack>

                            </Typography>


                        </span>
                    }

                />
                <ListItemSecondaryAction>
                    {ticket.lastMessage && (

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: -20 }}>

                            <Typography

                                className={Number(ticket.unreadMessages) > 0 ? classes.lastMessageTimeUnread : classes.lastMessageTime}
                                component="span"
                                variant="body2"
                                color="textSecondary"
                            >

                                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                                    <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                                ) : (
                                    <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                                )}



                            </Typography>

                            <Box>{renderTime()}</Box>

                            {/* <br /> */}


                        </Box>
                    )}



                    <span className={classes.secondaryContentSecond}>
                        {(ticket.status === "pending" && (ticket.queueId === null || ticket.queueId === undefined)) && (
                            <ButtonWithSpinner

                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'green', padding: '0px', borderRadius: "50%", right: '51px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleOpenAcceptTicketWithouSelectQueue()}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                                    <Done />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "pending" && ticket.queueId !== null) && (
                            <ButtonWithSpinner

                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'green', padding: '0px', borderRadius: "50%", right: '51px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleAcepptTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                                    <Done />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond1} >
                        {(ticket.status === "pending" || ticket.status === "open" || ticket.status === "group") && (
                            <ButtonWithSpinner

                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'purple', padding: '0px', borderRadius: "50%", right: '26px', position: 'absolute', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={handleOpenTransferModal}
                            >

                                <Tooltip title={`${i18n.t("ticketsList.buttons.transfer")}`}>
                                    <SwapHoriz />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>
                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "open" || ticket.status === "group") && (
                            <ButtonWithSpinner

                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'red', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleCloseTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.closed")}`}>
                                    <HighlightOff />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>

                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "pending") && (
                            <ButtonWithSpinner

                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'red', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleCloseIgnoreTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.ignore")}`}>
                                    <HighlightOff />
                                </Tooltip>
                            </ButtonWithSpinner>
                        )}
                    </span>

                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "closed" && (ticket.queueId === null || ticket.queueId === undefined)) && (
                            <ButtonWithSpinner

                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'orange', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleOpenAcceptTicketWithouSelectQueue()}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                                    <Replay />
                                </Tooltip>
                            </ButtonWithSpinner>

                        )}
                    </span>

                    <span className={classes.secondaryContentSecond} >
                        {(ticket.status === "closed" && ticket.queueId !== null) && (
                            <ButtonWithSpinner
                                style={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none', color: 'orange', padding: '0px', bottom: '0px', borderRadius: "50%", right: '1px', fontSize: '0.6rem', bottom: '-30px', minWidth: '2em', width: 'auto' }}
                                variant="contained"
                                className={classes.acceptButton}
                                size="small"
                                loading={loading}
                                onClick={e => handleAcepptTicket(ticket.id)}
                            >
                                <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                                    <Replay />
                                </Tooltip>
                            </ButtonWithSpinner>

                        )}
                    </span>
                </ListItemSecondaryAction>
                <ListItemSecondaryAction>

                </ListItemSecondaryAction>
            </ListItem>

            <Divider variant="inset" component="li" />
        </React.Fragment>
    );
};

export default TicketListItemCustom;
