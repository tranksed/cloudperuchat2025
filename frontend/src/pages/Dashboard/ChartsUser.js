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
import { Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
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
  Legend,
  ChartDataLabels
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
      align: 'start',
      color: '#fff',
      textStrokeColor: '#000',
      textStrokeWidth: 2,
      font: {
        size: 14,
        weight: 'bold',
      },
    },
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

export const ChartsUser = () => {
  const [initialDate, setInitialDate] = useState(getFirstDayOfMonth(new Date()));
  const [finalDate, setFinalDate] = useState(getLastDayOfMonth(new Date()));
  const [ticketsData, setTicketsData] = useState({
    data: [],
  });

  useEffect(() => {
    handleGetTicketsInformation();
  }, [initialDate, finalDate]); // Conforme as datas mudem a função é chamada

  const dataCharts = {
    labels: ticketsData?.data?.length > 0 ? ticketsData.data.map((item) => item.nome) : [],
    datasets: [
      {
        label: 'Dataset 1',
        data: ticketsData?.data.length > 0 ? ticketsData.data.map((item) => item.quantidade) : [],
        backgroundColor: [
          '#1A4783', '#FF6737', '#FF0505', '#32a852', '#FFFF00', '#FFD700', '#DAA520',
          '#FF8C00', '#808080', '#008B8B', '#008000', '#FFA500', '#9ACD32', '#228B22',
          '#FFA500', '#2F4F4F', '#8B0000', '#C0C0C0', '#808000', '#363636', '#836FFF',
          '#FFDAB9', '#FFA07A', '#7CFC00', '#B0E0E6', '#00FFFF', '#ff0000', '#FFFACD',
          '#66CDAA', '#EEE8AA', '#8FBC8F', '#ADFF2F', '#F0E68C', '#008080'
        ]
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
      },
      legend: {
        labels: {
          boxWidth: 10, // Largura dos retângulos dos labels
          boxHeight: 10, // Altura dos retângulos dos labels (em Chart.js v4)
        },
      },
    },
  };

  const handleGetTicketsInformation = async () => {
    try {
      const { data } = await api.get(`/dashboard/ticketsUsers?initialDate=${format(initialDate, 'yyyy-MM-dd')}&finalDate=${format(finalDate, 'yyyy-MM-dd')}`);
      setTicketsData(data);
    } catch (error) {
      toast.error('Erro ao buscar informações dos tickets');
    }
  }

  return (
    <>
      <Typography component="h2" variant="h6" gutterBottom style={{ color: "#153969" }}>
        Total de atendimentos por usuário
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
      <Doughnut options={options} data={dataCharts} plugins={[ChartDataLabels]} style={{ maxWidth: '100%', maxHeight: '280px' }} />
    </>
  );
}
