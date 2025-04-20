import React, { useEffect, useState } from "react";

import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Skeleton from "@material-ui/lab/Skeleton";

import { makeStyles } from "@material-ui/core/styles";
import { green, red } from '@material-ui/core/colors';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import moment from 'moment';

import Rating from '@material-ui/lab/Rating';
import { Grid, Typography } from "@material-ui/core";
import { Doughnut } from "react-chartjs-2";
import 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
    title: {
        // flex: '1 1 100%',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        color: "#153969",
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        maxHeight: '290px',
    },
    chartContainer: {
        width: '77%',
        height: '100%',
    },
    typography: {
        margin: 0,
        marginBottom: theme.spacing(1),
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        paddingRight: "8px",
        paddingLeft: "8px",
        paddingTop: "8px",
    },
}));

export function RatingBox({ rating }) {
    const ratingTrunc = rating === null ? 0 : Math.trunc(rating);
    return <Rating
        defaultValue={ratingTrunc}
        max={3}
        readOnly
    />
}

export default function TableMediaStatus(props) {
    const { loading, attendants, dataini, dataFinal} = props
    const classes = useStyles();

    const [dougsData, setDougsData] = useState(null);

    useEffect(() => {
        getNpmInformations()
    }, [dataini, dataFinal]);


    function renderList() {
        // return attendants.map((a, k) => (
        //     <TableRow key={k}>
        //         <TableCell>{a.name}</TableCell>
        //         <TableCell align="center" title="1 - Insatisfeito, 2 - Satisfeito, 3 - Muito Satisfeito" className={classes.pointer}>
        //             <RatingBox rating={a.rating} />
        //         </TableCell>
        //         <TableCell align="center">{formatTime(a.avgSupportTime, 2)}</TableCell>
        //         <TableCell align="center">
        //             {a.online ?
        //                 <CheckCircleIcon className={classes.on} />
        //                 : <ErrorIcon className={classes.off} />
        //             }
        //         </TableCell>
        //     </TableRow>
        // ))
    }


    async function getNpmInformations() {
        try {
            const params = {
                initialDate: dataini,
                finalDate: dataFinal
            }

            const { data } = await api.get("/dashboard/nps-info", { params })

            // const percentagens = {
            //     boa: (data[0].boa / data[0].total_notas) * 100,
            //     media: (data[0].media / data[0].total_notas) * 100,
            //     ruim: (data[0].ruim / data[0].total_notas) * 100,
            // };


            if (data.length > 0 && data[0].total_notas > 0) {
                const percentagens = {
                    boa: (data[0].boa / data[0].total_notas) * 100,
                    media: (data[0].media / data[0].total_notas) * 100,
                    ruim: (data[0].ruim / data[0].total_notas) * 100,
                };

                // console.log("Valor da Percentagem", percentagens)
                // console.log("Valor do Data", data[0])
                // console.log("Valor da Nota BOA", data[0].boa)

                setDougsData(percentagens);
            } else {
                setDougsData({
                    boa: 0,
                    media: 0,
                    ruim: 0,
                });
            }

        } catch (error) {
            console.log("erro ao buscar informações", error)
        }
    }


    const data = {
        labels: ['Ótimo', 'Bom', 'Ruim'],
        datasets: [
            {
                label: 'Avaliação do Atendimento',
                // data: [dougsData?.boa, dougsData?.media, dougsData?.ruim], //Carregando os dados
                data: dougsData ? [dougsData.boa, dougsData.media, dougsData.ruim] : [0, 0, 0],
                backgroundColor: ['#1A4783', '#FF6737', '#FF0505',],
                hoverBackgroundColor: ['#1A4783', '#FF6737', '#FF0505'],
            },
        ],
    };

    const options = {
        plugins: {
            datalabels: {
                color: '#FFFFFF', // Cor dos números
                font: {
                    weight: 'bold',
                    size: 10,
                },
                formatter: (value) => `${value.toFixed(0)}%`, // F ormata os números como porcentagem
            },
            legend: {
                labels: {
                    boxWidth: 10, // Largura dos retângulos dos labels
                    boxHeight: 10, // Altura dos retângulos dos labels (em Chart.js v4)
                    // font: {
                    // size: 14, // Tamanho dos labels na legenda
                    // },
                },
            },
        },
    };

    function formatTime(minutes) {
        return moment().startOf('day').add(minutes, 'minutes').format('HH[h] mm[m]');
    }

    return (!loading ?
        <TableContainer component={Paper} style={{ borderRadius: '5px', filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2))" }} >
            <div className={classes.header}>
                <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                    Avaliação dos Atendimentos
                </Typography>
            </div>


            <Grid justifyContent="center" alignItems="center">
                <Paper className={classes.paper}>
                    <div className={classes.chartContainer}>
                        {dougsData ? <Doughnut data={data} options={options} plugins={[ChartDataLabels]} /> : <Skeleton variant="rect" height={150} />}
                    </div>
                </Paper>
            </Grid>
        </TableContainer>
        : <Skeleton variant="rect" height={150} />
    )
}