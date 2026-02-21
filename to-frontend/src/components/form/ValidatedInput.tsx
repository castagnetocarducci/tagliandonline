import {Input, type InputProps, Label} from "design-react-kit"
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
    labelText?: string,
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
        labelText,
        inputProps,
        valueChangedCallback,
    }: ValidatedInputProps) {

    const [value, setValue] = useState("" + defaultValue);

    const inputPropsNN = inputProps || {};
    const inputType = inputPropsNN.type || "text";

    const incrementedValidationFunc = useCallback((value: ValidationSupportedTypes): boolean => {
        const isEmpty = value == null || value === "";
        if (isMandatory && isEmpty) {
            return false;
        }
        return validationFunc(value);
    }, [isMandatory, validationFunc]);
    const isEmpty = value == null || value === "";
    const isValid = incrementedValidationFunc(value);
    const labelContent = labelText || titleCase(name);

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
        <>
            {inputType === "checkbox" &&
                <div className={"form-check"}>
                    <Input id={name} name={name}
                           label={undefined}
                           validationText={persistingValidationText ? validationText : (!isEmpty && isValid ? "" : validationText)}
                           valid={validationMark ? isValid : (!isEmpty && isValid ? undefined : isValid)}
                           checked={value === "true"} onChange={(e) => onParameterChange(e.target.checked.toString())}
                           {...inputPropsNN}
                    />
                    <Label for={name}>{labelContent}</Label>
                </div>
            }
            {inputType !== "checkbox" &&
                <Input id={name} name={name}
                       label={labelContent}
                       validationText={persistingValidationText ? validationText : (!isEmpty && isValid ? "" : validationText)}
                       valid={validationMark ? isValid : (!isEmpty && isValid ? undefined : isValid)}
                       value={"" + value} onChange={(e) => onParameterChange(e.target.value)}
                    //rimuove il punto esclamativo alla fine per estetica
                       style={inputType === "password" ? {backgroundImage: "none"} : {}}
                       {...inputPropsNN}
                />
            }
        </>
    )


}
