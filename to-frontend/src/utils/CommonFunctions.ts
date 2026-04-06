import type {ValidationSupportedTypes} from "../hooks/useValidateFormInput.ts";

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const validateEmail = (newEmailValue: ValidationSupportedTypes): boolean => {
    const strValue = newEmailValue.toString();
    const regex = /^.+@.+$/;
    return regex.test(strValue);
}
