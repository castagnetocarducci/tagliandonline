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
    const [file, setFile] = useState<File | null>(null);
    const [dragOverClass, setDragOverClass] = useState(false);
    const dragOverClasses = classNames('upload-dragdrop', {
        dragover: dragOverClass,
        success: file != null
    });

    const incrementedValidationFunc = useCallback((value: ValidationSupportedTypes): boolean => {
        const isEmpty = value == null || value === "";
        console.log(isEmpty);
        if (isMandatory && isEmpty) {
            return false;
        }
        return validationFunc(value);
    }, [isMandatory, validationFunc]);
    const isValid = incrementedValidationFunc(file);

    useEffect(() => {
        setNewValidation(name, {
            value: file,
            errorMessage: errorMessage,
            validateFunc: incrementedValidationFunc,
        });
        if (valueChangedCallback != null) valueChangedCallback(file);
    }, [errorMessage, incrementedValidationFunc, isMandatory, name, setNewValidation, validationFunc, file, valueChangedCallback]);

    const handleDrop: DragEventHandler<HTMLDivElement> = (event) => {
            handleDrag(event);
            const droppedFiles = event.dataTransfer.files;
            if (droppedFiles.length > 0) {
                for (const dFile of droppedFiles) {
                    for (const ext of acceptedFileExtensions) {
                        if (dFile.name.endsWith(ext)) {
                            setFile(dFile);
                            return;
                        }
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
                {file != null && (
                    <div className='upload-dragdrop-success' style={{
                        maxWidth: "24px",
                        maxHeight: "24px",
                        left: "5px",
                    }}>
                        <Icon icon='it-check' size='xs'/>
                    </div>
                )}
            </div>
            <div className='upload-dragdrop-text'>
                {file != null && (
                    <p className='upload-dragdrop-weight'>
                        <Icon icon='it-file' size='xs'/>
                        {file.type + ' ' + byteConverter(file.size)}
                    </p>
                )}
                <span style={{lineHeight: "1.75rem"}}>
                    {file != null ? (
                        <strong>{file.name}</strong>
                    ) : (
                        <strong>{labelText || "Trascina il file per caricarlo"}</strong>
                    )}
                </span>
                <p>
                    {file != null ? (
                        <>per cambiarlo trascinalo oppure </>
                    ) : (
                        <>oppure </>
                    )}
                    <input type='file' id={name} name={name}
                           accept={acceptedFileExtensions?.join(",")}
                           className='upload-dragdrop-input' onChange={(e) => {
                        if (e.target.files == null) {
                            setFile(null);
                            return;
                        }
                        const filesArr: File[] = [];
                        for (const file of e.target.files) {
                            filesArr.push(file);
                        }
                        setFile(filesArr[0]);
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
