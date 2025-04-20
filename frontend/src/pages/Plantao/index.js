import React, { useEffect } from 'react';

import api from '../../services/api';
import { toast } from 'react-toastify';

import MainContainer from '../../components/MainContainer';
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import { ModalPlantao } from '../../components/ModalPlantao';
import ConfirmationModal from '../../components/ConfirmationModal';

import { Button, IconButton, makeStyles, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@material-ui/core';
import { green } from "@material-ui/core/colors";
import { DeleteOutline, Edit } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: theme.typography.pxToRem(14),
    border: "1px solid #dadde9",
    maxWidth: 450,
  },
  tooltipPopper: {
    textAlign: "center",
  },
  buttonProgress: {
    color: green[500],
  },
}));

export const Plantao = () => {

  const classes = useStyles();

  const [openModal, setOpenModal] = React.useState(false);
  const [plantaoId, setPlantaoId] = React.useState(null);
  const [listPlantao, setListPlantao] = React.useState([]);
  const [modalConfirmationOpen, setModalConfirmationOpen] = React.useState(false);

  useEffect(() => {

    handleGetPlantao();

  }, []);

  const handleGetPlantao = async () => {
    try {
      const { data } = await api.get("/plantao");
      setListPlantao(data);
    } catch (error) {
      console.log('lista plantao', error);
    }
  };

  const handleEditPlantao = (plantao) => {
    setPlantaoId(plantao.id);
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setPlantaoId(null);

  }

  const handleDeletePlantao = async () => {
    try {
      const { data } = await api.delete(`/plantao/${plantaoId}`);
      handleGetPlantao();
      toast.success('Plantão removido com sucesso');
    } catch (error) {
      console.log('delete plantao', error);
    }
  }

  const handleOpenConfirmationModal = (plantaoId) => {
    setModalConfirmationOpen(true);
    setPlantaoId(plantaoId);
  }

  return (
    <MainContainer>

      <ModalPlantao
        plantaoId={plantaoId}
        onClose={handleClose}
        open={openModal}
        callback={handleGetPlantao}
      />

      <ConfirmationModal
        title={'Remover plantonista'}
        open={modalConfirmationOpen}
        onClose={setModalConfirmationOpen}
        onConfirm={handleDeletePlantao}
      >
        {'Deseja realmente excluir este plantonista?'}
      </ConfirmationModal>

      <MainHeader>
        <Title>{'Plantão'}</Title>
        <MainHeaderButtonsWrapper>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenModal(true)}
          >
            {'Adicionar Plantão'}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">id</TableCell>
              <TableCell align="center">Plantonista</TableCell>
              <TableCell align="center">Telefone</TableCell>
              <TableCell align="center">Horarios</TableCell>
              <TableCell align="center">Ações</TableCell>

            </TableRow>
          </TableHead>
          <TableBody>


            {listPlantao?.length > 0 &&
              listPlantao.map((users) => (
                <TableRow key={users.id}>
                  <TableCell align="center">{users?.id}</TableCell>

                  <TableCell align="center">{users?.user?.name}</TableCell>

                  <TableCell align="center">{users?.phone}</TableCell>

                  <TableCell align="center">
                    <Box>
                      {users?.days.map((dia, index) => {
                        if (dia.startTime && dia.endTime) {
                          return (
                            <Typography key={index} variant="body2" color="textSecondary">
                              {`${dia.weekday} - ${dia.startTime} às ${dia.endTime}`}
                            </Typography>

                          )
                        }

                      })}
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditPlantao(users)}
                    >
                      <Edit />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        handleOpenConfirmationModal(users.id);
                      }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}


          </TableBody>
        </Table>
      </Paper>

    </MainContainer>

  );
}