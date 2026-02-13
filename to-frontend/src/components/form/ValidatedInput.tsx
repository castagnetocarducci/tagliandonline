import {Input, type InputProps} from "design-react-kit"
import type {SetValidationFunc, ValidationFunc, ValidationSupportedTypes} from "../../hooks/useValidateFormInput.ts";
import {useState} from "react";
import {titleCase} from "../../utils/StringUtils.ts";

type ValidatedInputProps = {
    name: string,
    validationFunc: ValidationFunc,
    validationText: string,
    persistingValidationText: boolean,
    validationMark: boolean,
    defaultValue: ValidationSupportedTypes,
    isMandatory: boolean,
    errorMessage: string,
    setNewValidation: SetValidationFunc
    inputProps?: InputProps
}

export function ValidatedInput(props: ValidatedInputProps) {
    const [value, setValue] = useState("" + props.defaultValue);
    const inputProps = props.inputProps || {};
    const isPassword = inputProps.type != null && inputProps.type === "password";

    const isEmpty = value == null || value === "";

    const incrementedValidationFunc = (value: ValidationSupportedTypes): boolean => {
        if (props.isMandatory && isEmpty) {
            return false;
        }
        return props.validationFunc(value);
    }
    const isValid = incrementedValidationFunc(value);

    const onParameterChange = (newValue: string) => {
        setValue(newValue);
    }

    props.setNewValidation(props.name, {
        value: value,
        errorMessage: props.errorMessage,
        validateFunc: incrementedValidationFunc,
    });

    return (
        <Input id={props.name} name={props.name} label={titleCase(props.name)}
               validationText={props.persistingValidationText ? props.validationText : (!isEmpty && isValid ? "" : props.validationText)}
               valid={props.validationMark ? isValid : (!isEmpty && isValid ? undefined : isValid)}
               value={value} onChange={(e) => onParameterChange(e.target.value)}
               //rimuove il punto esclamativo alla fine per estetica
               style={isPassword ? {backgroundImage: "none"} : {}}
               {...inputProps}
        />
    )


}
