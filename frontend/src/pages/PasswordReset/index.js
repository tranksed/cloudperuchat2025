import {
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import api from "../../services/api";
// import logo from "../../assets/logologin.png";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import SendIcon from "@mui/icons-material/Send";
import { styled } from "@mui/material/styles";
import { toast } from "react-toastify";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
// import { Toast } from "react-toastify/dist/components";

const useStyles = makeStyles((theme) => ({
  content: {
    position: "relative",
    background: "linear-gradient(135deg, #474c4f 0%, #090b11 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  paper: {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "55px 30px",
    borderRadius: "35px",
    color: "#FFF",
  },
  logo: {
    marginBottom: theme.spacing(2),
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    "& fieldset": {
      borderColor: "rgba(255, 255, 255, 0.2)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
  },
  "& .MuiInputBase-input": {
    color: "rgba(255, 255, 255, 0.9)",
    paddingLeft: "10px",
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255, 255, 255, 0.7)",
  },
}));
const StyledLink = styled(Link)({
  color: "rgba(255, 255, 255, 0.7)",
  textDecoration: "none",
  "&:hover": {
    color: "rgba(255, 255, 255, 0.9)",
    textDecoration: "underline",
  },
});
const ResetPasswordPage = () => {
  const classes = useStyles();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const [userFound, setUserFound] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeIncorrect, setCodeIncorrect] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [showVerifyButton, setShowVerifyButton] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState({ email: "", password: "" });

  const history = useHistory();

  const customSpacing = 16;

  const linkStyle = {
    textDecoration: "none", // Remover sublinhado do link
    color: "inherit", // Herdar a cor do texto original
    cursor: "pointer", // Adicionar cursor ao passar o mouse para indicar clicabilidade
  };

  const handleResetPassword = async () => {
    try {
      const response = await api.get("/api/obter-usuarios");
      const users = response.data;

      const foundUser = users.find((user) => user.email === email);

      if (foundUser) {
        setUserFound(true);
        setUserId(foundUser.id);
        setShowEmailInput(false);

        try {
          await api.post("/api/enviar-email", { email: foundUser.email });
          console.log("E-mail de verificação enviado com sucesso!");
        } catch (error) {
          console.error("Erro ao enviar e-mail de verificação:", error);
        }
      } else {
        setUserFound(false);
        toastError("Usuário não cadastrado.");
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toastError("Erro ao buscar usuários.");
    }
  };

  const handleResetPass = async () => {
    try {
      const {
        data: { userId },
      } = await api.post("/api/enviar-email", { wpp: email });

      setUserId(userId);

      setShowEmailInput(false);
      setUserFound(true);
      toast.success("Código de verificação enviado com sucesso!");
    } catch (error) {
      toastError(error.response.data.error);
    }
  };

  const handleVerifyCode = async () => {
    try {
      const response = await api.get(`/api/verificar-code/${email}`);
      const codeData = response.data;

      if (codeData && codeData.code === verificationCode) {
        setCodeVerified(true);
        setShowVerifyButton(false);
        setShowSuccessMessage(true);
      } else {
        toastError(
          "Código de verificação inválido. A senha não pode ser alterada."
        );
        setCodeIncorrect(true);
        setVerificationAttempts(verificationAttempts + 1);
      }
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      toastError("Erro ao verificar código.");
      // setSnackbarMessage("Erro ao verificar código.");
      // setOpenSnackbar(true);
    }

    if (codeIncorrect) {
      // setSnackbarMessage("Código de verificação incorreto. Tente novamente.");
      // setOpenSnackbar(true);
      toastError("Código de verificação incorreto. Tente novamente.");

      if (verificationAttempts >= 2) {
        toastError("Tentativas excedidas. Redirecionando...");

        setTimeout(() => {
          history.push("/login");
        }, 3000);
      }

      setCodeIncorrect(false);
    }
  };

  const handleResetCode = () => {
    setCodeIncorrect(false);
    setVerificationCode("");
  };

  const handleSavePassword = async () => {
    if (userFound && codeVerified) {
      try {
        // Substitua a chamada da API para atualizar a senha
        await api.put("/api/atualizar-senha", { userId, newPassword });

        toast.success("Senha atualizada com sucesso!");

        setTimeout(() => {
          history.push("/login");
        }, 1000);
      } catch (err) {
        console.error("Erro ao salvar senha:", err);
        toastError("Erro ao salvar senha.");
      }
    } else {
      console.error("Usuário não encontrado ou código de verificação inválido");
    }
  };

  const handleCloseSnackbar = () => {
    // setOpenSnackbar(false);
  };

  return (
    <div className={classes.content}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <div>
            {/* <img
              style={{ margin: "0 auto", height: "100px", width: "100%" }}
              // src={logo}
              alt="Whats"
            /> */}
          </div>
          <Typography component="h1" variant="h5">
            {i18n.t("passwordReset.title")}
          </Typography>
          <form className={classes.form}>
            {/* noValidate onSubmit={handlSubmit} */}
            {showEmailInput && (
              <StyledTextField
                required
                type="email"
                variant="outlined"
                margin="normal"
                fullWidth
                label={i18n.t("Whatsapp cadastrado")}
                // label={i18n.t("passwordReset.form.email")}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            {showEmailInput && (
              <Button
                type="submit"
                fullWidth
                variant="contained"
                onClick={handleResetPass}
                sx={{
                  borderRadius: "12px",
                  marginTop: 1,
                  marginBottom: 4,
                  padding: "12px",
                  background: "#090b11",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                  boxShadow: "0 4px 15px #090b11",
                  "&:hover": {
                    background: "#282929",
                    transition: "0.5s",
                  },
                }}
                endIcon={<SendIcon />}
              >
                {i18n.t("Enviar código de verificação")}
              </Button>
            )}
            <Grid container justify="flex-end">
              <Grid item>
                <StyledLink
                  href="#"
                  variant="body2"
                  to="/login"
                  //component={RouterLink}
                >
                  {i18n.t("passwordReset.voltar")}
                </StyledLink>
              </Grid>
            </Grid>
            {userFound && (
              <div>
                <TextField
                  label="Código de Verificação"
                  type="text"
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  onChange={(e) => setVerificationCode(e.target.value)}
                  value={verificationCode}
                  style={{ marginTop: customSpacing }}
                />

                {showVerifyButton && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleVerifyCode}
                    style={{ marginTop: customSpacing }}
                  >
                    {i18n.t("passwordReset.buttons.verify")}
                  </Button>
                )}

                {showSuccessMessage && (
                  <Typography
                    variant="body1"
                    style={{ color: "green", marginTop: customSpacing }}
                  >
                    Código validado com sucesso.
                  </Typography>
                )}

                {codeVerified && (
                  <>
                    <TextField
                      label="Nova Senha"
                      type={showPassword ? "text" : "password"}
                      variant="outlined"
                      margin="normal"
                      fullWidth
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ marginTop: customSpacing }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <Visibility />
                              ) : (
                                <VisibilityOff />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSavePassword}
                      style={{ marginTop: customSpacing }}
                    >
                      Salvar Senha
                    </Button>
                  </>
                )}
              </div>
            )}
          </form>
          {/* 
        
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <SnackbarContent
              message={snackbarMessage}
              style={{ backgroundColor: "green" }}
            />
          </Snackbar>
           */}
        </div>
      </Container>
    </div>
  );
};

export default ResetPasswordPage;
