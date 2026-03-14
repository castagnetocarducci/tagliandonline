export type ErrOrSuccess = {
    err?: string,
    success: boolean
}

export type ModificationEntry = {
    description: string,
    value: string
}

export type HistoryModificationMap = {
    [key: string]: ModificationEntry
}

export type HistoryEvent = {
    userId: number,
    username: string,
    timestamp: Date,
    modificationsMap: HistoryModificationMap
}

export type PagerPageData = {
    currentPage: number,
    totalPages: number
}