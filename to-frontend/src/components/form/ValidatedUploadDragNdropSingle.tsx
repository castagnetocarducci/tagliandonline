import classNames from "classnames";
import {type DragEventHandler, useCallback, useEffect, useState} from "react";
import DragandDropIcon from '../../assets/upload-drag-drop-icon.svg';
import {Icon} from "design-react-kit";
import type {SetValidationFunc, ValidationFunc, ValidationSupportedTypes} from "../../hooks/useValidateFormInput.ts";


type ValidatedUploadDragNdropSingleProps = {
    name: string,
    acceptedFileExtensions?: string[],
    validationFunc: ValidationFunc,
    validationText: string,
    isMandatory: boolean,
    errorMessage: string,
    setNewValidation: SetValidationFunc,
    labelText?: string,
    valueChangedCallback?: (newFile: File | null) => void,
}

export const ValidatedUploadDragNdropSingle = (
    {
        name,
        acceptedFileExtensions = [],
        validationFunc,
        validationText,
        isMandatory,
        errorMessage,
        setNewValidation,
        labelText,
        valueChangedCallback,
    }: ValidatedUploadDragNdropSingleProps) => {
    const [fileArr, setFileArr] = useState<File[]>([]);
    const [dragOverClass, setDragOverClass] = useState(false);
    const dragOverClasses = classNames('upload-dragdrop', {
        dragover: dragOverClass,
        success: fileArr.length > 0
    });

    const checkExtension = useCallback((newFile: File): boolean => {
        if (acceptedFileExtensions == null || acceptedFileExtensions.length === 0) {
            return true;
        }
        for (const ext of acceptedFileExtensions) {
            if (newFile.name.endsWith(ext)) {
                return true;
            }
        }
        return false;
    }, [acceptedFileExtensions])

    const incrementedValidationFunc = useCallback((value: ValidationSupportedTypes): boolean => {
        const isEmpty = value == null || value === "" ||
            (value instanceof Array ? value.length === 0 : false); //testo per Array perché non posso testare direttamente File[], in questo caso Array vuoto significa campo non impostato
        if (isMandatory && isEmpty) {
            return false;
        }
        if (!isMandatory && isEmpty) {
            return true;
        }
        if (!isEmpty && (value instanceof Array)) { //testo per Array perché non posso testare direttamente File[]
            if (!(value[0] instanceof File)) {
                return false;
            }
            if (!checkExtension(value[0])) {
                return false;
            }
        }
        return validationFunc(value);
    }, [checkExtension, isMandatory, validationFunc]);
    const isValid = incrementedValidationFunc(fileArr);

    useEffect(() => {
        setNewValidation(name, {
            value: fileArr,
            errorMessage: errorMessage,
            validateFunc: incrementedValidationFunc,
        });
        if (valueChangedCallback != null) valueChangedCallback(fileArr.length > 0 ? fileArr[0] : null);
    }, [errorMessage, incrementedValidationFunc, isMandatory, name, setNewValidation, validationFunc, fileArr, valueChangedCallback]);


    const handleDrop: DragEventHandler<HTMLDivElement> = (event) => {
            handleDrag(event);
            const droppedFiles = event.dataTransfer.files;
            if (droppedFiles.length > 0) {
                for (const dFile of droppedFiles) {
                    if (checkExtension(dFile)) {
                        setFileArr([dFile]);
                        return;
                    }
                }
            }
            setDragOverClass(false);
        },
        handleDrag: DragEventHandler<HTMLDivElement> = (event) => {
            event.preventDefault();
            event.stopPropagation();
        },
        handleDragOver: DragEventHandler<HTMLDivElement> = (event) => {
            handleDrag(event);
            setDragOverClass(true);
        },
        handleDragLeave: DragEventHandler<HTMLDivElement> = (event) => {
            handleDrag(event);
            setDragOverClass(false);
        };

    const byteConverter = (bytes: number) => {
        const K_UNIT = 1024;
        const SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

        if (bytes == 0) return '0 Byte';

        const i = Math.floor(Math.log(bytes) / Math.log(K_UNIT)),
            resp = parseFloat((bytes / Math.pow(K_UNIT, i)).toFixed(2)) + ' ' + SIZES[i];

        return resp;
    };

    return (
        <div onDrop={handleDrop}
             onDrag={handleDrag}
             onDragStart={handleDrag}
             onDragEnd={handleDrag}
             onDragExit={handleDrag}
             onDragOver={handleDragOver}
             onDragEnter={handleDrag}
             onDragLeave={handleDragLeave}
             className={dragOverClasses + " p-2 w-100"}
             style={{
                 // https://kovart.github.io/dashed-border-generator/
                 backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='4' ry='4' stroke='%23333' stroke-width='2' stroke-dasharray='5' stroke-dashoffset='4' stroke-linecap='square'/%3e%3c/svg%3e\")",
                 borderRadius: "4px",
                 height: "5rem",
             }}>
            <div className='upload-dragdrop-image' style={{
                maxHeight: "4rem",
                maxWidth: "4rem",
            }}>
                <img src={DragandDropIcon} alt='descrizione immagine' aria-hidden='true'/>
                {fileArr.length > 0 && (
                    <div className='upload-dragdrop-success' style={{
                        maxWidth: "24px",
                        maxHeight: "24px",
                        left: "5px",
                    }}>
                        <Icon icon='it-check' size='xs'/>
                    </div>
                )}
            </div>
            <div className='upload-dragdrop-text' style={{lineHeight: "1.25rem"}}>
                {fileArr.length > 0 && (
                    <p className='upload-dragdrop-weight'>
                        <Icon icon='it-file' size='xs'/>
                        {fileArr[0].type + ' ' + byteConverter(fileArr[0].size)}
                    </p>
                )}
                <span>
                    {fileArr.length > 0 ? (
                        <strong>{fileArr[0].name}</strong>
                    ) : (
                        <strong>{labelText || "Trascina il file per caricarlo"}</strong>
                    )}
                </span>
                <p>
                    {fileArr.length > 0 ? (
                        <>per cambiarlo trascinalo oppure </>
                    ) : (
                        <>oppure </>
                    )}
                    <input type='file' id={name} name={name}
                           accept={acceptedFileExtensions?.join(",")}
                           className='upload-dragdrop-input' onChange={(e) => {
                        if (e.target.files == null) {
                            return;
                        }
                        for (const file of e.target.files) {
                            if (checkExtension(file)) {
                                setFileArr([file]);
                                return;
                            }
                        }
                    }}/>
                    <label htmlFor={name}>selezionalo dal dispositivo</label>

                </p>
                {!isValid && (
                    <p style={{color: "#d9364f"}}>
                        {validationText}
                    </p>
                )}

                {/*<div className={"form-text form-feedback " + (isValid ? "" : "just-validate-error-label")}>*/}
                {/*    {persistingValidationText || !isValid ? validationText : ""}*/}
                {/*</div>*/}

            </div>
        </div>
    );
};
