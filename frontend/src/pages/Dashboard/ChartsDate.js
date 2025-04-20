import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import brLocale from 'date-fns/locale/pt-BR';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Stack, TextField } from '@mui/material';
import Typography from "@material-ui/core/Typography";
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Button from "@material-ui/core/Button";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      display: false,
    },
    title: {
      display: true,
      text: 'Tickets',
      position: 'left',
    },
    datalabels: {
      display: true,
      anchor: 'start',
      offset: -30,
      align: "start",
      color: "#fff",
      textStrokeColor: "#000",
      textStrokeWidth: 2,
      font: {
        size: 20,
        weight: "bold"
      },
    }
  },
};

// Função para obter o último dia do mês
const getLastDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Função para obter o primeiro dia do mês
const getFirstDayOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const ChartsDate = () => {
  const [initialDate, setInitialDate] = useState(getFirstDayOfMonth(new Date()));
  const [finalDate, setFinalDate] = useState(getLastDayOfMonth(new Date()));
  const [ticketsData, setTicketsData] = useState({
    data: [],
    count: 0,
  });

  useEffect(() => {
    handleGetTicketsInformation();
  }, [initialDate, finalDate]);

  const dataCharts = {
    labels: ticketsData?.data.length > 0 ? ticketsData.data.map((item) => item.hasOwnProperty('horario') ? `Das ${item.horario}:00 às ${item.horario}:59` : item.data) : [],
    datasets: [
      {
        label: 'Dataset 1',
        data: ticketsData?.data.length > 0 ? ticketsData.data.map((item) => item.total) : [],
        backgroundColor: ['#1A4783']
      },
    ],
  };

  const handleGetTicketsInformation = async () => {
    try {
      const { data } = await api.get(`/dashboard/total-atendimentos?initialDate=${format(initialDate, 'yyyy-MM-dd')}&finalDate=${format(finalDate, 'yyyy-MM-dd')}`);
      setTicketsData(data);
    } catch (error) {
      toast.error('Erro ao buscar informações dos tickets');
    }
  };

  return (
    <>
      <Typography component="h2" variant="h6" gutterBottom style={{ color: "#153969" }}>
        Total de atendimentos {ticketsData?.count}
      </Typography>

      <Stack direction={'row'} spacing={2} alignItems={'center'} sx={{ my: 2 }} >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
          <DatePicker
            value={initialDate}
            onChange={(newValue) => setInitialDate(newValue)}
            label="Data inicial"
            renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
          <DatePicker
            value={finalDate}
            onChange={(newValue) => setFinalDate(newValue)}
            label="Data final"
            renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}
          />
        </LocalizationProvider>

        {/* <Button
          className="buttonHover"
          onClick={handleGetTicketsInformation}
          style={{ backgroundColor: "#1A4783", color: "white" }}
        >
          Filtrar
        </Button> */}
      </Stack>

      <Bar options={options} data={dataCharts} style={{ maxWidth: '100%', maxHeight: '280px' }} />
    </>
  );
}
