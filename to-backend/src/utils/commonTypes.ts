export type ErrOrSuccess = {
    err?: string,
    success: boolean
}

export type HistoryModificationMap = {
    [key: string]: string
}

export type HistoryEvent = {
    userId: number,
    username: string,
    timestamp: Date,
    modificationsMap: HistoryModificationMap
}