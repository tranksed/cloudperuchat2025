import React, { useEffect, useState, useContext } from "react";
import QRCode from "qrcode.react";
import toastError from "../../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";
import { Dialog, DialogContent, Paper, Typography } from "@material-ui/core";
import api from "../../services/api";
import { socketConnection } from "../../services/socket";
import { AuthContext } from "../../context/Auth/AuthContext";

// Define o estilo do componente
const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    borderRadius: "20px", // Define o arredondamento das bordas do Dialog
  },
  qrCodeContainer: {
    marginTop: "30px", // Espaçamento adicional para descer o QR Code
    display: "flex",
    justifyContent: "center", // Opcional: centraliza o QR Code na tela
  },
  title: {
    fontSize: "26px", // Tamanho maior para o título
    fontWeight: "bold",
    fontFamily: "Montserrat",
    marginBottom: "0px", // Espaçamento abaixo do título
	marginTop: "-25px", //Move o texto para baixo (aumente o valor para mover mais para baixo)
  },
  subText: {
    fontSize: "16px", // Tamanho maior para o texto abaixo
    fontFamily: "Montserrat",
    fontWeight: "normal",
    marginTop: "10px",
    marginBottom: "30px", // Adicionando o espaçamento entre o texto adicional e os passos
  },
  stepImageIOS: {
    width: "30px", // Tamanho ajustado da imagem
    height: "auto", // Mantém a proporção da imagem
    marginRight: "0px", // Espaçamento à direita da imagem
    marginLeft: "-2px", // Espaçamento à esquerda da imagem
    marginTop: "0px",  // Move a imagem para baixo (aumente o valor para mover mais para baixo)
    marginBottom: "0px", // Não há espaço abaixo da imagem (pode ajustar se necessário)
  },
  stepImageAndroid: {
    width: "10px", // Tamanho ajustado da imagem
    height: "auto", // Mantém a proporção da imagem
    marginRight: "0px", // Espaçamento à direita da imagem
    marginLeft: "0px", // Espaçamento à esquerda da imagem
    marginTop: "0px",  // Move a imagem para cima (aumente o valor para mover mais para cima)
    marginBottom: "0px", // Não há espaço abaixo da imagem (pode ajustar se necessário)
  },
  stepText1: {
    marginBottom: "1px", // Espaçamento maior entre os passos
  },
  stepText: {
    marginBottom: "15px", // Espaçamento maior entre os passos
  },
  helpText: {
    fontSize: "14px", // Tamanho de fonte ajustado para o texto de ajuda
    textAlign: "left", // Alinhamento do texto
	marginTop: "0px", // Espaçamento acima do texto de ajuda
	marginBottom: "20px", // Ajustar espaço abaixo do texto (pode ajustar se necessário)
  },
}));

const QrcodeModal = ({ open, onClose, whatsAppId }) => {
  const [qrCode, setQrCode] = useState("");
  const { user } = useContext(AuthContext);
  const classes = useStyles();

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`/whatsapp/${whatsAppId}`);
        setQrCode(data.qrcode);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  useEffect(() => {
    if (!whatsAppId) return;
    const companyId = user.companyId;
    const socket = socketConnection({ companyId, userId: user.id });

    socket.on(`company-${companyId}-whatsappSession`, (data) => {
      if (data.action === "update" && data.session.id === whatsAppId) {
        setQrCode(data.session.qrcode);
      }

      if (data.action === "update" && data.session.qrcode === "") {
        onClose();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [whatsAppId, onClose,user]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      scroll="paper"
      classes={{ paper: classes.dialogPaper }} // Aplica o estilo ao Dialog
    >
      <DialogContent>
        <Paper elevation={0} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ marginRight: "20px" }}>
            {/* Título maior adicionado */}
            <Typography variant="h2" className={classes.title}>
              Acessar WhatsApp no Whaticket
            </Typography>

            {/* Texto adicional abaixo */}
            <Typography variant="body1" color="textPrimary" className={classes.subText}>
              Envie mensagens privadas para seus clientes diretamente pelo WhatsApp no Whaticket.
            </Typography>

            {/* Passo a passo */}
            <Typography variant="body1" color="textPrimary" className={classes.stepText1}>
              1 - Abra o WhatsApp no seu celular
            </Typography>
            <Typography variant="body1" color="textPrimary" className={classes.stepText}>
              2 - Toque em Mais opções no Android{" "}
              <img src={require("../../components/QrcodeModal/img/WconfAndroid.png")} alt="Android" className={classes.stepImageAndroid} />{" "}
              ou em Configurações{" "}
              <img src={require("../../components/QrcodeModal/img/WconfIos.png")} alt="iPhone" className={classes.stepImageIOS} />
              no iPhone
            </Typography>
            <Typography variant="body1" color="textPrimary" className={classes.stepText}>
              3 - Toque em Dispositivos conectados e, em seguida, em Conectar dispositivos
            </Typography>
            <Typography variant="body1" color="textPrimary" className={classes.stepText}>
              4 - Aponte seu celular para essa tela para capturar o QR Code
            </Typography>
          </div>
          <div className={classes.qrCodeContainer}>
            {qrCode ? (
              <QRCode value={qrCode} size={256} />
            ) : (
              <span>Aguardando pelo QR Code</span>
            )}
          </div>
        </Paper>

        {/* Texto de ajuda incorporado */}
        <Typography variant="body2" color="primary" className={classes.helpText}>
          <a href="https://faq.whatsapp.com/1317564962315842/?cms_platform=web" target="_blank" rel="noopener noreferrer">
            Precisa de ajuda para começar?
          </a>
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(QrcodeModal);