import React, { useEffect, useState } from "react";

import { QueryClient, QueryClientProvider } from "react-query";
import "react-toastify/dist/ReactToastify.css";

import { useMediaQuery } from "@material-ui/core";
import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import ColorModeContext from "./layout/themeContext";

import { ActiveMenuProvider } from "./context/ActiveMenuContext";
import Routes from "./routes";

const queryClient = new QueryClient();

const App = () => {
  const [locale, setLocale] = useState();

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(
    preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light"
  );

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );

  const theme = createTheme(
    {
      scrollbarStyles: {
        "&::-webkit-scrollbar": {
          width: "8px",
          height: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
          backgroundColor: "#3d759c", // Cor da barra de rolagem
          borderRadius: "10px", // Deixa a barra de rolagem arredondada
        },
      },

      scrollbarStylesSoft: {
        "&::-webkit-scrollbar": {
          width: "8px",
          height: "8px", // Adicionando altura caso necessário para scroll horizontal
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: mode === "light" ? "#F3F3F3" : "#333333", // Cor da barra de rolagem com base no tema
          borderRadius: "10px", // Deixa a barra de rolagem arredondada
        },
      },
      palette: {
        type: mode,
        primary: { main: "#065183" },
        textPrimary: mode === "light" ? "#065183" : "#FFFFFF",
        borderPrimary: mode === "light" ? "#065183" : "#FFFFFF",
        dark: { main: mode === "light" ? "#333333" : "#F3F3F3" },
        light: { main: mode === "light" ? "#F3F3F3" : "#333333" },
        tabHeaderBackground: mode === "light" ? "#EEE" : "#666",
        optionsBackground: mode === "light" ? "#fafafa" : "#333",
        fancyBackground: mode === "light" ? "#fafafa" : "#333",
        total: mode === "light" ? "#fff" : "#222",
        messageIcons: mode === "light" ? "grey" : "#F3F3F3",
        inputBackground: mode === "light" ? "#FFFFFF" : "#333",
        barraSuperior: "#065183",
      },
      mode,
    },
    locale
  );

  useEffect(() => {
    const i18nlocale = localStorage.getItem("i18nextLng");
    const browserLocale =
      i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

    if (browserLocale === "ptBR") {
      setLocale(ptBR);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  return (
    <ColorModeContext.Provider value={{ colorMode }}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <ActiveMenuProvider>
            <Routes />
          </ActiveMenuProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
