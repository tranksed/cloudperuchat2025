import { parsePhoneNumberFromString } from 'libphonenumber-js';

class FormatMask {
    setPhoneFormatMask(phoneToFormat) {
        if (!phoneToFormat) {
            return "Número não disponível"; // Retorna caso o número seja inválido ou não existam
        }

        // Remove caracteres não numéricos
        const number = phoneToFormat.replace(/\D/g, "");

        // Verifica se o número tem pelo menos 10 dígitos
        if (number.length < 10) {
            return "Número inválido"; // Número inválido com menos de 10 dígitos
        }

        // Verifica se o número já contém um código de país
        let formattedPhoneNumber = phoneToFormat;
        if (!formattedPhoneNumber.startsWith("+")) {
            // O número não contém um código de país, a função irá detectá-lo
            formattedPhoneNumber = "+" + number;
        }

        // Tenta parsear o número com a libphonenumber-js
        const parsedPhoneNumber = parsePhoneNumberFromString(formattedPhoneNumber);

        if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
            return "Número inválido"; // Caso o número não seja válido
        }

        // Formatação do número com DDD entre parênteses
        const formattedNumber = parsedPhoneNumber.formatNational();
        const formattedWithDDD = formattedNumber.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');

        // Retorna o número formatado com o DDD entre parênteses
        return `+${parsedPhoneNumber.countryCallingCode} ${formattedWithDDD}`;
    }

    removeMask(number) {
        // Remove todos os caracteres não numéricos
        return number.replace(/\D/g, "");
    }

    maskPhonePattern(phoneNumber) {
        // Máscara genérica que pode ser ajustada automaticamente para o país do número
        return phoneNumber.length <= 12 ? '+XX (XX) XXXX XXXX' : '+XX (XX) XXXXX XXXX';
    }
}

export { FormatMask };
