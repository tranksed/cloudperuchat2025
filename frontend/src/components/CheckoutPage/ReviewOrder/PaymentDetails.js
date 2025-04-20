import React, { useContext } from 'react';
import { Typography, Grid, Box } from '@material-ui/core';
import useStyles from './styles';
import { AuthContext } from "../../../context/Auth/AuthContext";

function PaymentDetails({ formValues }) {
  const classes = useStyles();
  const { name, zipcode, plan, company } = formValues;
  const { user } = useContext(AuthContext);

  const newPlan = JSON.parse(plan);
  const { price } = newPlan;

  const details = [
    { label: 'Email', value: user.email },
    { label: 'Nome', value: name },
    { label: 'CPF/CNPJ', value: company.document },
    { label: 'CEP', value: zipcode },
    { label: 'Total', value: `R$${price.toLocaleString('pt-br', { minimumFractionDigits: 2 })}` },
  ];

  return (
    <Box p={2} className={classes.root}>
      <Typography variant="h6" gutterBottom className={classes.title}>
        Informação de pagamento
      </Typography>
      <Grid container spacing={2}>
        {details.map((detail, index) => (
          <Grid container key={index} spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body1" gutterBottom>
                {detail.label}:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" gutterBottom>
                {detail.value}
              </Typography>
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default PaymentDetails;
