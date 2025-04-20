import React, { useState, useEffect, useRef } from "react";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import FormHelperText from "@material-ui/core/FormHelperText";

import GroupAddIcon from '@material-ui/icons/GroupAdd';
import SpeedIcon from "@material-ui/icons/Speed";
import GroupIcon from "@material-ui/icons/Group";
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import CancelIcon from '@material-ui/icons/Cancel';
import DateRangeIcon from '@material-ui/icons/DateRange';
import PersonIcon from "@material-ui/icons/Person";
import TodayIcon from '@material-ui/icons/Today';
import BlockIcon from '@material-ui/icons/Block';
import DoneIcon from '@material-ui/icons/Done';

import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";

import Chart from "./Chart";
import ButtonWithSpinner from "../../components/ButtonWithSpinner";

import CardCounter from "../../components/Dashboard/CardCounter";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { isArray } from "lodash";

import useDashboard from "../../hooks/useDashboard";
import useCompanies from "../../hooks/useCompanies";

import { ChartsDate } from "./ChartsDate";
import { ChartsQueue } from "./ChartsQueue";
import { ChartsUser } from "./ChartsUser";

import { isEmpty } from "lodash";
import moment from "moment";
import { Card, CardContent } from "@mui/material";
import { Typography } from "@material-ui/core";
// import TableMediaStatus from "../../components/Dashboard/TableMediaStatus";
import TableTempMedioStatus from "../../components/Dashboard/TableTempoMedioStatus";
import TableTempWaitStatus from "../../components/Dashboard/TableTempoWaitStatus";
import api from "../../services/api";
// import { getInformations } from "../../components/Dashboard/TableTempoMedioStatus";
import MainContainer from '../../components/MainContainer';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
}));

const Dashboard = () => {
  const dashboardRef = useRef();
  const classes = useStyles();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [companyDueDate, setCompanyDueDate] = useState();
  // const [getInformations, setGetInformations] = useState(null);
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DD")
  );


  const getLastDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]; //Essa função retorna o ultimo dia de cada mês
  };
  // const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(getLastDayOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const { find } = useDashboard();
  const { finding } = useCompanies();
  const [contagemEncerrados, setContagemEncerrados] = useState(null);
  const [clickFilter, setClickFIlter] = useState(false); // Jhonnatan criou esse useState

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
    }
    setTimeout(() => {
      firstLoad();
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function handleChangeFilterType(value) {
    setFilterType(value);
    if (value === 1) {
      setPeriod(0);
    } else {
      setDateFrom("");
      setDateTo("");
    }
  }

  async function fetchData() {
    // await getInformations(); // chamando a função aqui
    setLoading(true);

    let params = {};

    if (period > 0) {
      params = {
        days: period,
      };
    }

    if (!isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = {
        ...params,
        date_from: moment(dateFrom).format("YYYY-MM-DD"),
      };
    }

    if (!isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = {
        ...params,
        date_to: moment(dateTo).format("YYYY-MM-DD"),
      };
    }

    if (Object.keys(params).length === 0) {
      toast.error("Parametrize o filtro");
      setLoading(false);
      return;
    }

    const data = await find(params);



    setCounters(data.counters);
    if (isArray(data.attendants)) {
      setAttendants(data.attendants);
    } else {
      setAttendants([]);
    }



    setLoading(false);
  }

  useEffect(() => {
    async function fetchData() {
      await loadCompanies();
    }
    fetchData();
    chatsEncerrados();
  }, [])
  //let companyDueDate = localStorage.getItem("companyDueDate");
  //const companyDueDate = localStorage.getItem("companyDueDate").toString();
  const companyId = localStorage.getItem("companyId");
  const loadCompanies = async () => {
    setLoading(true);
    try {
      const companiesList = await finding(companyId);

      const date = localStorage.getItem("companyDueDate");

      setCompanyDueDate(date);
    } catch (e) {
      // toast.error("Não foi possível carregar a lista de registros");
    }
    setLoading(false);
  };

  // ****************** TESTANDO GETINFORMATIONS AQUI

  const getInformations = async () => {
    try {
      const params = {
        initialDate: dateFrom,
        finalDate: dateTo,
      };
      const { data } = await api.get("/dashboard/user-info", { params });
      // console.log("dados ", data)

      /**
       * ???? tava funcionando sua funcao]
       * deixa eu testar uma coisa aqui
       */
      // Handle data
    } catch (error) {
      console.error("Erro ao buscar informações: ", error);
    }
  };

  //      ATÉ AQUI

  // *************** TESTANDO O GETNPMINFORMATIONS

  async function getNpmInformations() {
    try {
      const params = {
        initialDate: dateFrom,
        finalDate: dateTo
      }

      const { data } = await api.get("/dashboard/nps-info", { params })

      const percentagens = {
        boa: (data[0].boa / data[0].total_notas) * 100,
        media: (data[0].media / data[0].total_notas) * 100,
        ruim: (data[0].ruim / data[0].total_notas) * 100,
      };


    } catch (error) {
      console.log("erro ao buscar informações", error)
    }
  }

  // // ***************** TESTANDO O GETASSESSMENTINFORMATIONS

  async function getAssessmentInformations() {
    try {
      const params = {
        initialDate: dateFrom,
        finalDate: dateTo
      }

      const { data } = await api.get("/dashboard/assessment-info", { params })


    } catch (error) {
      console.log("erro ao buscar informações ", error)
    }
  }

  // eu ainda não chamei no front... tipo tava vendo como eu ia chamar...

  // MEU DEUS 

  // SE PERDE TEMPO DE MAIS ... COMO VOU CHAMAR ? OUSH DO MESMO JEITO QUE CHAMA AS OUTRAS 

  // CRIA UM CARAI DE FUNÇÃO ,...


  const chatsEncerrados = async () => {
    // chama a api aqui igual os outrops

    const params = {
      initialDate: dateFrom,
      finalDate: dateTo
    }

    // salva testa de novo

    // to perdido nao seui qualk é a requisição



    const { data } = await api.get('/dashboard/atendimentos-encerrados', { params });

    setContagemEncerrados(data)

    // cooloca um carai de log pra ver od dados cheghando

    // que dificuldade é fazer isso ?????? pensar em que ????

    /// se mata atoa  ...
  }


  function formatTime(minutes) {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  }

  function renderFilters() {
    if (filterType === 1) {
      return (
        <>
          <Grid item xs={3} sm={6} md={3}>
            <TextField
              label="Data Inicial"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={3} sm={6} md={3}>
            <TextField
              label="Data Final"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={classes.fullWidth}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </>
      );
    } else {
      return (
        <Grid item xs={4} sm={6} md={4}>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="period-selector-label">Período</InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              value={period}
              onChange={(e) => handleChangePeriod(e.target.value)}
            >
              <MenuItem value={0}>Nenhum selecionado</MenuItem>
              <MenuItem value={3}>Últimos 3 dias</MenuItem>
              <MenuItem value={7}>Últimos 7 dias</MenuItem>
              <MenuItem value={15}>Últimos 15 dias</MenuItem>
              <MenuItem value={30}>Últimos 30 dias</MenuItem>
              <MenuItem value={60}>Últimos 60 dias</MenuItem>
              <MenuItem value={90}>Últimos 90 dias</MenuItem>
            </Select>
            <FormHelperText>Selecione o período desejado</FormHelperText>
          </FormControl>
        </Grid>
      );
    }
  }

  const handleFilterButtonClick = async () => {
    await fetchData();

    setClickFIlter(prev => !prev);
    // getInformations

    // isso aqui daria certo??

    /**
     * pq quer fazer isso ?
     * Essa função fetchData, ela atualiza os campos né?
     * dai ela tava sendo chamada no botão filtrar, daí criei esse hand pra quando clicar chamar os dois.
     */

    // await getInformations;
  };

  // async function getInformations() {
  //   try {


  //     const params = {
  //       initialDate: dateFrom,
  //       finalDate: dateTo
  //     }


  //     const { data } = await api.get("/dashboard/user-info", { params })

  //     console.log('dados' , data)


  //     /**qual era a difilculdade de fazer isso ?????
  //      * 
  //      * Eu fiz uma parte disso aí ta até comentado pq deu erro
  //      */

  //     /**
  //      * ROTA (ENDPOINT)
  //      * /dashboard/user-info
  //      * 
  //      */
  //     // setTicketsData(data[0])

  //   } catch (error) {
  //     console.log("erro ao buscar informações ", error)
  //   }

  // };

  return (
    <MainContainer>
      <Container maxWidth="lg" className={classes.container}>
        <Grid container spacing={3} justifyContent="flex-end">


          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              icon={
                <GroupAddIcon
                  fontSize="inherit"
                  htmlColor="white"
                  style={{
                    backgroundColor: "#1A4783",
                    borderRadius: "30%",
                    padding: "8px",
                    // border: "1px solid #ccc",
                    // boxSizing: "border-box",
                    // width: "80px",
                    // height: "80px"
                  }}
                />
              }

              title="Chats Pendentes"
              value={counters.supportPending}
              loading={loading}
            />
          </Grid>




          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              icon={<GroupIcon
                fontSize="inherit"
                htmlColor="white"
                style={{
                  backgroundColor: "#1A4783",
                  borderRadius: "30%",
                  padding: "8px",
                  // border: "1px solid #ccc",
                  // boxSizing: "border-box",
                  // width: "80px",
                  // height: "80px"
                }}
              />
              }
              title="Chats Ativos"
              value={counters.supportHappening}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              icon={<AssignmentTurnedInIcon
                fontSize="inherit"
                htmlColor="white"
                style={{
                  backgroundColor: "#1A4783",
                  borderRadius: "30%",
                  padding: "8px",
                  // border: "1px solid #ccc",
                  // boxSizing: "border-box",
                  // width: "80px",
                  // height: "80px"
                }}
              />
              }
              title="Chats Concluídos"
              value={counters.supportFinished}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              icon={<CancelIcon
                fontSize="inherit"
                htmlColor="white"
                style={{
                  backgroundColor: "#1A4783",
                  borderRadius: "30%",
                  padding: "8px",
                  // border: "1px solid #ccc",
                  // boxSizing: "border-box",
                  // width: "80px",
                  // height: "80px"
                }}
              />
              }
              title="Chats Encerrados"
              value={contagemEncerrados}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              title="Leads"
              value={(counters.leads)}
              loading={loading}
              icon={<PersonIcon
                fontSize="inherit"
                htmlColor="white"
                style={{
                  backgroundColor: "#1A4783",
                  borderRadius: "30%",
                  padding: "8px",
                  // border: "1px solid #ccc",
                  // boxSizing: "border-box",
                  // width: "80px",
                  // height: "80px"
                }}
              />
              }

            />
          </Grid>


          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              icon={<SpeedIcon
                fontSize="inherit"
                htmlColor="white"
                style={{
                  backgroundColor: "#1A4783",
                  borderRadius: "30%",
                  padding: "8px",
                  // border: "1px solid #ccc",
                  // boxSizing: "border-box",
                  // width: "80px",
                  // height: "80px"
                }}
              />
              }
              title="T.M. de Atendimento"
              value={formatTime(counters.avgSupportTime)}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              title="T.M. de Espera"
              value={formatTime(counters.avgWaitTime)}
              loading={loading}
              icon={<SpeedIcon
                fontSize="inherit"
                htmlColor="white"
                style={{
                  backgroundColor: "#1A4783",
                  borderRadius: "30%",
                  padding: "8px",
                  // border: "1px solid #ccc",
                  // boxSizing: "border-box",
                  // width: "80px",
                  // height: "80px"
                }}
              />
              }

            />
          </Grid>



          <Grid item xs={12} sm={6} md={3}>
            <CardCounter
              title="Data Vencimento"
              value={companyDueDate}
              loading={loading}
              icon={
                <div style={{
                  backgroundColor: "#1A4783",
                  borderRadius: "30%",
                  padding: "8px",
                  // border: "1px solid #ccc",
                  // boxSizing: "border-box",
                  // width: "80px",
                  // height: "80px"
                }}>
                  <DateRangeIcon
                    fontSize="inherit"
                    htmlColor="white"
                  />
                </div>
              }

            />
          </Grid>


          <Grid item xs={12} sm={6} md={6}>
            {attendants.length ? (
              <TableAttendantsStatus
                attendants={attendants}
                loading={loading}
                dataini={dateFrom}
                dataFinal={dateTo}
              />
            ) : null}

          </Grid>

          <Grid item xs={12} sm={3} md={3}>
            {attendants.length ? (
              <TableTempMedioStatus
                attendants={attendants}
                loading={loading}
                dataini={dateFrom}
                dataFinal={dateTo}
                reload={clickFilter} //Jhonnatan Criou isso aqui também
              />

            ) : null}
          </Grid>

          <Grid item xs={12} sm={3} md={3}>
            {attendants.length ? (
              <TableTempWaitStatus
                attendants={attendants}
                loading={loading}
                dataini={dateFrom}
                dataFinal={dateTo}
                reload={clickFilter}
              />
            ) : null}
          </Grid>


          {/* Informativo da data de Vecimento */}


          <Grid item xs={4} sm={7} md={4}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="period-selector-label">Tipo de Filtro</InputLabel>
              <Select
                labelId="period-selector-label"
                value={filterType}
                onChange={(e) => handleChangeFilterType(e.target.value)}
              >
                <MenuItem value={1}>Filtro por Data</MenuItem>
                <MenuItem value={2}>Filtro por Período</MenuItem>
              </Select>
              <FormHelperText>Selecione o período desejado</FormHelperText>
            </FormControl>
          </Grid>

          {renderFilters()}

          <Grid item xs={2} sm={6} md={2} className={classes.alignRight}>
            <ButtonWithSpinner
              loading={loading}
              onClick={handleFilterButtonClick}
              // onClick={() => fetchData()}
              // variant="contained"
              // color="primary"
              style={{ backgroundColor: "#1A4783", color: "white" }}
            >
              Filtrar
            </ButtonWithSpinner>
          </Grid>


          <Grid item xs={12} sm={12} md={6}>
            <Card style={{ borderRadius: "20px" }}>
              <CardContent>
                <ChartsQueue />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={12} md={6}>
            <Card style={{ borderRadius: "20px" }}>
              <CardContent>
                <ChartsUser />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={12} md={12}>
            <Card style={{ borderRadius: "20px" }}>
              <CardContent>
                <ChartsDate />
              </CardContent>
            </Card>
          </Grid>



        </Grid>
      </Container>
    </MainContainer >
  );
};

export default Dashboard;
