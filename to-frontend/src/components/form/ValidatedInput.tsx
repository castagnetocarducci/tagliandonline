import {Input, type InputProps} from "design-react-kit"
import type {SetValidationFunc, ValidationFunc, ValidationSupportedTypes} from "../../hooks/useValidateFormInput.ts";
import {titleCase} from "../../utils/StringUtils.ts";
import {useCallback, useEffect, useState} from "react";

type ValidatedInputProps = {
    name: string,
    validationFunc: ValidationFunc,
    validationText: string,
    persistingValidationText: boolean,
    validationMark: boolean,
    defaultValue: ValidationSupportedTypes,
    isMandatory: boolean,
    errorMessage: string,
    setNewValidation: SetValidationFunc,
    inputProps?: InputProps,
    valueChangedCallback?: (newValue: ValidationSupportedTypes) => void,
}

export function ValidatedInput(
    {
        name,
        validationFunc,
        validationText,
        persistingValidationText,
        validationMark,
        defaultValue,
        isMandatory,
        errorMessage,
        setNewValidation,
        inputProps,
        valueChangedCallback,
    }: ValidatedInputProps) {

    const [value, setValue] = useState("" + defaultValue);

    const inputPropsNN = inputProps || {};
    const isPassword = inputPropsNN.type != null && inputPropsNN.type === "password";

    const incrementedValidationFunc = useCallback((value: ValidationSupportedTypes): boolean => {
        const isEmpty = value == null || value === "";
        if (isMandatory && isEmpty) {
            return false;
        }
        return validationFunc(value);
    }, [isMandatory, validationFunc]);
    const isEmpty = value == null || value === "";
    const isValid = incrementedValidationFunc(value);

    const onParameterChange = (newValue: string) => {
        setValue(newValue);
    }
    
    useEffect(() => {
        setNewValidation(name, {
            value: value,
            errorMessage: errorMessage,
            validateFunc: incrementedValidationFunc,
        });
        if (valueChangedCallback != null) valueChangedCallback(value);
    }, [errorMessage, incrementedValidationFunc, isMandatory, name, setNewValidation, validationFunc, value, valueChangedCallback]);

    return (
        <Input id={name} name={name} label={titleCase(name)}
               validationText={persistingValidationText ? validationText : (!isEmpty && isValid ? "" : validationText)}
               valid={validationMark ? isValid : (!isEmpty && isValid ? undefined : isValid)}
               value={"" + value} onChange={(e) => onParameterChange(e.target.value)}
            //rimuove il punto esclamativo alla fine per estetica
               style={isPassword ? {backgroundImage: "none"} : {}}
               {...inputPropsNN}
        />
    )


}
