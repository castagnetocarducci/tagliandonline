import {Select} from "design-react-kit"
import type {SetValidationFunc, ValidationFunc, ValidationSupportedTypes} from "../../hooks/useValidateFormInput.ts";
import {titleCase} from "../../utils/StringUtils.ts";
import {useCallback, useEffect, useState} from "react";

export type SelectOption = { value: string, label: string };

type ValidatedSelectProps = {
    name: string,
    validationFunc: ValidationFunc,
    validationText: string,
    persistingValidationText: boolean,
    defaultValue: ValidationSupportedTypes,
    isMandatory: boolean,
    errorMessage: string,
    setNewValidation: SetValidationFunc,
    labelText: string,
    options: SelectOption[],
    valueChangedCallback?: (newValue: ValidationSupportedTypes) => void,
}

export function ValidatedSelect(
    {
        name,
        validationFunc,
        validationText,
        persistingValidationText,
        defaultValue,
        isMandatory,
        errorMessage,
        setNewValidation,
        labelText,
        options,
        valueChangedCallback,
    }: ValidatedSelectProps) {

    const [value, setValue] = useState("" + defaultValue);

    const incrementedValidationFunc = useCallback((value: ValidationSupportedTypes): boolean => {
        const isEmpty = value == null || value === "";
        if (isMandatory && isEmpty) {
            return false;
        }
        const valuesArr = options.map((elem) => elem.value);
        if (!valuesArr.includes("" + value)) {
            return false;
        }
        return validationFunc(value);
    }, [isMandatory, options, validationFunc]);

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
            <Select id={name} name={name} label={labelContent} className={" " + (isValid ? "" : "is-invalid")}
                    value={"" + value} onChange={(e) => onParameterChange(e)}>
                {options.map(({value, label}, index) => (
                    <option key={index} label={label}>{value}</option>
                ))}
            </Select>
            {/* Preso dall'html dell'input (validated). Gli sviluppatori di designers Italia hanno deciso di non mettere il valid feedback sul select, semplicemente l'ho reintrodotto. */}
            <div className={"form-text form-feedback mb-4" + " " + (isValid ? "" : "just-validate-error-label")}>
                {persistingValidationText || !isValid ? validationText : ""}
            </div>

        </>
    )


}
