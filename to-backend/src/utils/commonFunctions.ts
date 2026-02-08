
export const getErrorString = (error: any): string => {
    return (error instanceof Error ? error.toString() : "Unknown error.");
}

