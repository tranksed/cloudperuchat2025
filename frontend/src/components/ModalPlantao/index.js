import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field, FastField, FieldArray } from "formik";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import { FormHelperText, Grid, Tooltip, Typography } from "@material-ui/core";
import NumberFormat from "react-number-format";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectDaysModal: {
    height: '24px',
    width: '24px',
    borderRadius: '50%',
    border: '1px solid black',
    fontSize: '10px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8px',
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    cursor: 'pointer'
  }
}));


const initialValues = {
  userId: '',
  phone: '',
  interval: 1,
  days: [
    { weekday: "Segunda-feira", weekdayEn: "Monday", startTime: null, endTime: null, },
    { weekday: "Terça-feira", weekdayEn: "Tuesday", startTime: null, endTime: null, },
    { weekday: "Quarta-feira", weekdayEn: "Wednesday", startTime: null, endTime: null, },
    { weekday: "Quinta-feira", weekdayEn: "Thursday", startTime: null, endTime: null, },
    { weekday: "Sexta-feira", weekdayEn: "Friday", startTime: null, endTime: null },
    { weekday: "Sábado", weekdayEn: "Saturday", startTime: null, endTime: null },
    { weekday: "Domingo", weekdayEn: "Sunday", startTime: null, endTime: null },
  ]
};


const validationSchema = Yup.object().shape({
  userId: Yup.string().required('Informe o usuário'),
  phone: Yup.string().required('Informe o telefone'),
  interval: Yup.number().required('Informe o intervalo entre notificações'),

  days: Yup.array()
    .of(
      Yup.object().shape({
        startTime: Yup.string()
          .nullable()
          .test(
            'startTime-required-if-endTime',
            'Informe o início do plantão',
            function (value) {
              const { endTime } = this.parent;
              if (endTime) {
                return !!value;
              }
              return true;
            }
          ),
        endTime: Yup.string()
          .nullable()
          .test(
            'endTime-required-if-startTime',
            'Informe o fim do plantão',
            function (value) {
              const { startTime } = this.parent;
              if (startTime) {
                return !!value;
              }
              return true;
            }
          ),
      })
    )
    .test(
      'at-least-one-day-filled',
      'Pelo menos um dia da semana deve ter o horário de início e fim preenchido',
      function (days) {
        return days.some(day => day.startTime && day.endTime);
      }
    ),
});

export const ModalPlantao = ({ open, onClose, plantaoId, callback }) => {

  const classes = useStyles();
  const [plantao, setPlantao] = useState(initialValues);

  useEffect(() => {

    if (plantaoId) {
      handleGetPlantaoDetails();
    }
  }, [plantaoId]);


  const handleClose = () => {
    onClose();
    setPlantao(initialValues);
  };

  const handleSave = async (values) => {

    try {
      const { data } = await api.post('/plantao', values);
      handleClose();
      callback();
    } catch (error) {
      console.log('erro ao salvar plantonista', error);
      toastError(error);
    }

  }

  const handleGetPlantaoDetails = async () => {
    try {
      const { data } = await api.get(`/plantao/${plantaoId}`);
      console.log('data', data);
      setPlantao(data);
    } catch (error) {
      console.log('erro ao buscar plantonista', error);
    }
  }

  const handleUpdatePlantao = async (values) => {
    try {
      const { data } = await api.put(`/plantao/${plantaoId}`, values);
      handleClose();
      callback();
    } catch (error) {
      console.log('erro ao atualizar plantonista', error);
    }
  }

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {plantaoId
            ? `Editar plantonista`
            : `Adicionar plantonista`}
        </DialogTitle>
        <Formik
          initialValues={plantao}
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              plantaoId
                ? handleUpdatePlantao(values)
                : handleSave(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, values, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <Grid container spacing={1}>

                  <Grid item xs={4}>
                    <UsersContainer
                      value={values.userId}
                      setFieldValue={setFieldValue}
                      error={touched.userId && Boolean(errors.userId)}
                      helperText={touched.userId && errors.userId}
                    />
                  </Grid>



                  <Grid item xs={4}>
                    <TextField
                      value={values.phone}
                      style={{ marginTop: 0 }}
                      margin="dense"
                      label="Telefone"
                      placeholder="5513912344321"
                      variant="outlined" fullWidth
                      onChange={(e) => setFieldValue('phone', e.target.value)}
                      error={touched.phone && Boolean(errors.phone)}
                      helperText={touched.phone && errors.phone}
                    />

                  </Grid>

                  <Grid item xs={4}>
                    <TextField
                      value={values.interval.toString()}
                      style={{ marginTop: 0 }}
                      margin="dense"
                      label="Intervalo"
                      placeholder=""
                      variant="outlined" fullWidth
                      onChange={(e) => setFieldValue('interval', e.target.value)}
                      error={touched.interval && Boolean(errors.interval)}
                      helperText={touched.interval ? errors.interval : 'Intervalo entre notificações'}
                    />

                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom> Dias da semana</Typography>
                  </Grid>

                  {/* Exibir erro global do array days */}


                  {values.days.map((item, index) => {

                    const startTimeError = errors?.days?.[index]?.startTime;
                    const endTimeError = errors?.days?.[index]?.endTime;
                    const startTimeTouched = touched?.days?.[index]?.startTime;
                    const endTimeTouched = touched?.days?.[index]?.endTime;

                    return (
                      <Grid container spacing={1} key={index}>

                        <Grid item xs={4}>
                          <FastField
                            as={TextField}
                            label="Dia da Semana"
                            name={`days[${index}].weekday`}
                            disabled
                            variant="outlined"
                            margin="dense"
                          />
                        </Grid>

                        <Grid item xs={4}>
                          <FastField name={`days[${index}].startTime`}>
                            {({ field }) => (
                              <NumberFormat
                                label="Inicio do plantão"
                                {...field}
                                variant="outlined"
                                margin="dense"
                                customInput={TextField}
                                format="##:##"
                                error={startTimeTouched && Boolean(startTimeError)}
                                helperText={startTimeTouched && startTimeError}
                              />
                            )}
                          </FastField>
                        </Grid>

                        <Grid item xs={4}>
                          <FastField name={`days[${index}].endTime`}>
                            {({ field }) => (
                              <NumberFormat
                                label="Fim do plantão"
                                {...field}
                                variant="outlined"
                                margin="dense"
                                customInput={TextField}
                                format="##:##"
                                error={endTimeTouched && Boolean(endTimeError)}
                                helperText={endTimeTouched && endTimeError}

                              />
                            )}
                          </FastField>
                        </Grid>
                      </Grid>
                    );
                  })}

                  {errors.days && typeof errors.days === 'string' && (
                    <Grid item xs={12}>
                      <Typography color="error" variant="body2">
                        {errors.days}
                      </Typography>
                    </Grid>
                  )}


                </Grid>


              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("userModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                >
                  {plantaoId
                    ? `${i18n.t("userModal.buttons.okEdit")}`
                    : `${i18n.t("userModal.buttons.okAdd")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>

  );
}

export const UsersContainer = (props) => {

  const { value, setFieldValue, error, helperText } = props;

  const [listUsersAttendance, setListUsersAttendance] = React.useState([]);

  useEffect(() => {
    fetchUsersAttendance();
  }, [])

  const fetchUsersAttendance = async () => {

    try {
      const { data } = await api.get(`/users/list`);

      setListUsersAttendance(data);

    } catch (error) {
      console.log('erro buscar usuarios', error);
    }

  };

  const handleChange = (event) => {

    const { value: selectedUser } = event.target;

    setFieldValue('userId', selectedUser);
  };


  return (
    <FormControl
      error={error}
      helperText={helperText}
      fullWidth size="small" variant="outlined" >
      <InputLabel  >Usuário</InputLabel>
      <Select
        variant="outlined"
        value={value}
        label="Usuário"
        onChange={handleChange}
        MenuProps={MenuProps}

      >
        {listUsersAttendance.map((user) => (
          <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
        ))}
      </Select>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )

}



const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
export const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 200,
    },
  },
};