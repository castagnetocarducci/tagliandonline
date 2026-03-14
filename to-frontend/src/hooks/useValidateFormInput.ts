import {useRef, useState} from "react";

export type ValidationSupportedTypes = string | number | boolean | Date | File[];
// export type ValidationValueObjectTypes = string | number | boolean | Date | File;

export type ValidationFunc = (value: ValidationSupportedTypes) => boolean;

export type ValidationKit = {
    value: ValidationSupportedTypes,
    validateFunc: ValidationFunc,
    errorMessage: string
}

export type SetValidationFunc = (name: string, validationKit: ValidationKit) => void;

export type ValidatedFormValuesMap = { [k: string]: ValidationSupportedTypes }

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
                if (setError) {
                    setErr(validationKit.errorMessage + ": " + name);
                }
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

    const getValueObject = (): ValidatedFormValuesMap => {
        const valuesObj: ValidatedFormValuesMap = {};
        for (const [name, validationKit] of mapRef.current.entries()) {
            // if (validationKit.value instanceof Array) { //se è un array è sicuramente File[]
            //     //se l'array è vuoto non lo associo proprio
            //     if (validationKit.value.length === 0) {
            //         continue;
            //     } else {
            //         //quando creo l'oggetto che verrà trasmesso in rete inserisco il file direttamente solo se esiste
            //         valuesObj[name] = validationKit.value[0];
            //         continue;
            //     }
            // }
            let toAssignValue = validationKit.value;
            if (typeof(toAssignValue) === "string") {
                toAssignValue = toAssignValue.trim();
            }
            valuesObj[name] = validationKit.value;
        }
        return valuesObj;
    }

    return {valid, setValidation, getValueObject, executeValidation};
}





