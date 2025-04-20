import * as Yup from 'yup';
import checkoutFormModel from './checkoutFormModel';
const {
  formField: {
    firstName,
    zipcode,
  }
} = checkoutFormModel;


export default [
  Yup.object().shape({
    [firstName.name]: Yup.string().required(`${firstName.requiredErrorMsg}`),

    [zipcode.name]: Yup.string()
      .required(`${zipcode.requiredErrorMsg}`),
  }),

];
