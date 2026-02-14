import {useRef, useState} from "react";

export type ValidationSupportedTypes = string | number | boolean | Date;

export type ValidationFunc = (value: ValidationSupportedTypes) => boolean;

export type ValidationKit = {
    value: ValidationSupportedTypes,
    validateFunc: ValidationFunc,
    errorMessage: string
}

export type SetValidationFunc = (name: string, validationKit: ValidationKit) => void;

export const useValidateFormInput = (setErr: (newVal: string | null) => void, setSucc: (newVal: string | null) => void) => {
    const mapRef = useRef(new Map<string, ValidationKit>());
    const [valid, setValid] = useState<boolean>(false);

    const executeValidation = (setError: boolean = false, resetErrSucc: boolean = false): void => {
        if (mapRef.current == null) {
            return;
        }
        if (resetErrSucc) {
            setSucc(null);
            setErr(null);
        }
        for (const [name, validationKit] of mapRef.current.entries()) {
            if (!validationKit.validateFunc(validationKit.value)) {
                if (setError) {setErr(validationKit.errorMessage + ": " + name);}
                setValid(false);
                return;
            }
        }
        setValid(true);
    }

    const setValidation: SetValidationFunc = (name: string, validationKit: ValidationKit): void => {
        if (mapRef.current == null) {
            return;
        }
        const vKit = mapRef.current.get(name);
        const valueUpdated = vKit == null || vKit.value !== validationKit.value;
        mapRef.current.set(name, validationKit);
        executeValidation(false, valueUpdated);
    }

    const getValueObject = (): { [k: string]: ValidationSupportedTypes } => {
        const valuesObj: { [k: string]: ValidationSupportedTypes } = {};
        for (const [name, validationKit] of mapRef.current.entries()) {
            valuesObj[name] = validationKit.value;
        }
        return valuesObj;
    }

    return {valid, setValidation, getValueObject, executeValidation};
}





