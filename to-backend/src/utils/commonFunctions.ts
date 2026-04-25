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

export const dateToLocaleString = (date: Date): string => {
    //format date in dd/mm/yyy with 2 zero padding
    return date.toLocaleDateString("it-IT", {day: "2-digit", month: "2-digit", year: "numeric"});
}

export const dateToLocaleStringOrEmpty = (dateStr: string | null): string => {
    if (dateStr == null || dateStr.trim() === "") {
        return "";
    }
    const date = new Date(dateStr);
    if (date.toString() === "Invalid Date") {
        return "";
    }
    return dateToLocaleString(date);
}