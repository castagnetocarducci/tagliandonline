import type {ValidationSupportedTypes} from "../hooks/useValidateFormInput.ts";

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const validateEmail = (newEmailValue: ValidationSupportedTypes): boolean => {
    if (newEmailValue == null) {
        return false;
    }
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

export const allStringsEmpty = (...strings: unknown[]): boolean => {
    if (strings == null) return true;
    for (const str of strings) {
        if (str != null && (("" + str).trim() !== "")) return false;
    }
    return true;
}


