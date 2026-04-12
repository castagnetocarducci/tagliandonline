import type {ValidationSupportedTypes} from "../hooks/useValidateFormInput.ts";

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const validateEmail = (newEmailValue: ValidationSupportedTypes): boolean => {
    const strValue = newEmailValue.toString();
    const regex = /^.+@.+$/;
    return regex.test(strValue);
}

export const dateStrToISOString = (dateStr: Date | string | null) => {
    if (dateStr == null) {
        return "";
    }
    const dateConv = new Date(dateStr);
    if (dateConv.toString() === "Invalid Date") {
        return "";
    }
    return dateConv.toISOString().split('T')[0];
}

