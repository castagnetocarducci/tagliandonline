
export const getErrorString = (error: any): string => {
    return (error instanceof Error ? error.toString() : "Unknown error.");
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}