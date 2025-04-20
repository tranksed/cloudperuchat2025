import React, { useEffect, useState } from "react";

import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Skeleton from "@material-ui/lab/Skeleton";

import { makeStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";

import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import moment from "moment";

import Rating from "@material-ui/lab/Rating";
import { Grid, Typography } from "@material-ui/core";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  title: {
    // flex: '1 1 100%',
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    color: "#153969",
    paddingLeft: "8px",
    paddingRight: "8px",
    // paddingTop: "8px"
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    maxHeight: "270px",
    // minHeight: "270px"
  },
  icon: {
    marginTop: 25,
    fontSize: 100,
    marginBottom: theme.spacing(1),
    color: "white",
    backgroundColor: "#1A4783",
    borderRadius: "30%",
    // padding: "8px",
  },
  typography: {
    margin: 0,
    marginBottom: theme.spacing(1),
    fontSize: 20,
  },
  boldTypography: {
    margin: 0,
    fontWeight: "bold",
  },
  container: {
    borderRadius: "5px",
    filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2))",
  },
  header: {
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    paddingRight: "8px",
    paddingLeft: "8px",
    paddingTop: "8px",
  },
}));

export function RatingBox({ rating }) {
  const ratingTrunc = rating === null ? 0 : Math.trunc(rating);
  return <Rating defaultValue={ratingTrunc} max={3} readOnly />;
}

export default function TableMediaStatus(props) {
  const { loading, attendants, dataini, dataFinal } = props; 
  const classes = useStyles();

  const [ticketsData, setTicketsData] = useState(null);

  useEffect(() => {
    getInformations();

    /**pronto
     *
     *  :O
     *
     * esse reload é pra executar toda vez que clicar no botao? s
     *
     */
  }, [dataini, dataFinal]); 

  function renderList() {
    // return attendants.map((a, k) => (
    // <TableRow key={k}>
    //     <TableCell>{a.name}</TableCell>
    //     <TableCell align="center" title="1 - Insatisfeito, 2 - Satisfeito, 3 - Muito Satisfeito" className={classes.pointer}>
    //         <RatingBox rating={a.rating} />
    //     </TableCell>
    //     <TableCell align="center">{formatTime(a.avgSupportTime, 2)}</TableCell>
    //     <TableCell align="center">
    //         {a.online ?
    //             <CheckCircleIcon className={classes.on} />
    //             : <ErrorIcon className={classes.off} />
    //         }
    //     </TableCell>
    // </TableRow>
    // ))
  }

  async function getInformations() {
    try {
      const params = {
        initialDate: dataini,
        finalDate: dataFinal,
      };

      const { data } = await api.get("/dashboard/user-info", { params });

      /**
       * ROTA (ENDPOINT)
       * /dashboard/user-info
       *
       */
      setTicketsData(data[0]);
    } catch (error) {
      console.log("erro ao buscar informações ", error);
    }
  }

  function formatTime(minutes) {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  }

  // pronto dados tao indo pro back isso foi confirmado

  return !loading ? (
    <TableContainer component={Paper} className={classes.container}>
      <div className={classes.header}>
        <Typography
          className={classes.title}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Atendente em Destaque
        </Typography>
      </div>

      <Grid justifyContent="center" alignItems="center">
        <Paper className={classes.paper}>
          <AccountCircleIcon
            style={{
              fontSize: "6vw",
              color: "#1A4783",
            }}
          />
          <Typography className={classes.typography}>
            {ticketsData?.name || "Usuário"}
          </Typography>
          <Typography className={classes.boldTypography}>
            {ticketsData?.quantidade || 0} <br />
            Atendimentos
          </Typography>
        </Paper>
      </Grid>
    </TableContainer>
  ) : (
    <Skeleton variant="rect" height={150} />
  );
}
