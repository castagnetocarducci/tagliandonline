import type {HistoryModificationMap, ModificationEntry} from "./commonTypes.ts";

export const getErrorString = (error: any): string => {
    return (error instanceof Error ? error.toString() : "Unknown error.");
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const checkAndUpdateValueModificationsMap = (diffModificationEntries: HistoryModificationMap, currModificationEntries: HistoryModificationMap, key: string, newEntry: ModificationEntry) => {
    if (currModificationEntries[key] == null || currModificationEntries[key].value !== newEntry.value) {
        currModificationEntries[key] = {...newEntry};
        diffModificationEntries[key] = {...newEntry};
    }
}