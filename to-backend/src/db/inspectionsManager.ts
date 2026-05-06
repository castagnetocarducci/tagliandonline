import {DatabaseManager} from "./databaseManager.ts";
import {
    getDetailedOngoingInspectionsFull,
    getOngoingInspectionsDetails,
    type InspectionCheck,
    type InspectionDetails
} from "../api/v1/inspections.ts";
import {Mutex} from "../utils/mutex.ts";
import type {VoucherCurrentState} from "../api/v1/vouchers.ts";
import {dateToLocaleString} from "../utils/commonFunctions.ts";


type CachedVehicle = {
    checkId: number,
    vehicleId: number,
    plate: string,
    model: string,
    brand: string
}

type CachedPermit = {
    permitId: number,
    description: string,
    disabled: boolean,
    simultaneousPlatesAmount: number,
    applicationPlatesAmount: number,
    voucherDurationDays: number | null,
    voucherExpiryDate: Date | null,
}

export type CachedVoucher = {
    voucherId: number,
    number: number,
    revoked: boolean,
    currentState: VoucherCurrentState,
    validFromDate: Date,
    validToDate: Date,
    vehicles: CachedVehicle[],
    permit: CachedPermit,
}

export type CachedAnomaly = CachedVoucher & {
    reasons: string[],
}

// map <id voucher, found vehicles>
type CachedVouchersMap = Map<number, CachedVoucher>


/**
 * singleton
 */
export class InspectionsManager {
    static #instance: InspectionsManager;
    db;
    #inspectionsCache: {
        [inspectionId: number]: CachedVouchersMap,
    } = {}
    #inspectionMutex = new Mutex();

    public static get instance(): InspectionsManager {
        if (!InspectionsManager.#instance) {
            InspectionsManager.#instance = new InspectionsManager();
        }
        return InspectionsManager.#instance;
    }

    private constructor() {
        this.db = DatabaseManager.instance.db;
    }

    public async init() {
        // const replacingAdminPassword = ConfigProvider.instance.configs.replacingAdminPassword;
        // if (replacingAdminPassword != null && replacingAdminPassword.length > 0) {
        //     const adminPasswordHash = await generatePasswordHash(replacingAdminPassword);
        //     await this.db.update(authUsers).set({
        //         passwordHash: adminPasswordHash,
        //         disabled: false,
        //         lastPasswordResetDate: new Date(),
        //         roleId: roles.id,
        //     }).from(roles).where(and(or(eq(authUsers.id, 1), eq(authUsers.username, "admin")), eq(roles.description, "admin")));
        //     console.log("Admin password updated");
        // }
        await this.loadInspections();
    }

    static isAlreadyChecked(check: InspectionCheck, vouchersMap: CachedVouchersMap) {
        const voucherHistory = check.voucherHistory;
        let cachedVehicles: CachedVehicle[] = [];
        if (vouchersMap.has(voucherHistory.voucherId)) {
            cachedVehicles = (vouchersMap.get(voucherHistory.voucherId) as CachedVoucher).vehicles;
        }
        const vehicleId = check.vehicleHistory.vehicleId;
        for (const cachedVehicle of cachedVehicles) {
            if (cachedVehicle.vehicleId === vehicleId) {
                return true;
            }
        }
        return false;
    }

    static addCheckToVouchersMap(check: InspectionCheck, vouchersMap: CachedVouchersMap) {
        const voucherHistory = check.voucherHistory;
        let cachedVehicles: CachedVehicle[] = [];
        if (vouchersMap.has(voucherHistory.voucherId)) {
            cachedVehicles = (vouchersMap.get(voucherHistory.voucherId) as CachedVoucher).vehicles;
        }
        const toAddVehicle: CachedVehicle = {
            checkId: check.id,
            vehicleId: check.vehicleHistory.vehicleId,
            plate: check.vehicleHistory.plate,
            model: check.vehicleHistory.model,
            brand: check.vehicleHistory.brand,
        };
        const cachedPermit: CachedPermit = {
            permitId: check.voucherHistory.permitHistory.permitId,
            description: check.voucherHistory.permitHistory.description,
            disabled: check.voucherHistory.permitHistory.disabled,
            simultaneousPlatesAmount: check.voucherHistory.permitHistory.simultaneousPlatesAmount,
            applicationPlatesAmount: check.voucherHistory.permitHistory.applicationPlatesAmount,
            voucherDurationDays: check.voucherHistory.permitHistory.voucherDurationDays,
            voucherExpiryDate: check.voucherHistory.permitHistory.voucherExpiryDate,
        }
        if (!InspectionsManager.isAlreadyChecked(check, vouchersMap)) {
            cachedVehicles.push(toAddVehicle);
        }
        const toSetVoucher: CachedVoucher = {
            vehicles: cachedVehicles,
            permit: cachedPermit,
            currentState: voucherHistory.currentState,
            voucherId: voucherHistory.voucherId,
            number: voucherHistory.number,
            revoked: voucherHistory.revoked,
            validFromDate: voucherHistory.validFromDate,
            validToDate: voucherHistory.validToDate,
        }
        vouchersMap.set(voucherHistory.voucherId, toSetVoucher);
        return InspectionsManager.getAnomalyFromVoucher(toSetVoucher);
    }

    static removeCheckFromVouchersMap(checkId: number, voucherId: number, vouchersMap: CachedVouchersMap) {
        if (vouchersMap.has(voucherId)) {
            const cachedVoucher = vouchersMap.get(voucherId) as CachedVoucher;
            let cachedVehicles: CachedVehicle[] = cachedVoucher.vehicles.filter(v => v.checkId !== checkId);
            if (cachedVehicles.length === 0) {
                vouchersMap.delete(voucherId);
            } else {
                vouchersMap.set(voucherId, {
                    vehicles: cachedVehicles,
                    permit: cachedVoucher.permit,
                    currentState: cachedVoucher.currentState,
                    voucherId: cachedVoucher.voucherId,
                    number: cachedVoucher.number,
                    revoked: cachedVoucher.revoked,
                    validFromDate: cachedVoucher.validFromDate,
                    validToDate: cachedVoucher.validToDate,
                });
            }
        } else {
            throw new Error("Voucher non trovato nella mappa");
        }
    }

    static getAnomalyFromVoucher(voucher: CachedVoucher): CachedAnomaly | null {
        const reasons: string[] = [];
        if (voucher.currentState === "Revocato") {
            reasons.push("Tagliando revocato");
        }
        if (voucher.currentState === "Scaduto") {
            reasons.push("Tagliando scaduto il " + dateToLocaleString(voucher.validToDate));
        }
        if (voucher.currentState === "Non ancora valido") {
            reasons.push("Il tagliando sarà valido a partire dal giorno " + dateToLocaleString(voucher.validFromDate));
        }
        if (voucher.permit.disabled) {
            reasons.push("Permesso disabilitato o decaduto");
        }
        //-1 senza limite
        if (voucher.permit.simultaneousPlatesAmount !== -1 && voucher.vehicles.length > voucher.permit.simultaneousPlatesAmount) {
            reasons.push("Sono consentiti solo " + voucher.permit.simultaneousPlatesAmount + " veicoli per volta, ma ne sono stati trovati " + voucher.vehicles.length);
        }
        if (reasons.length > 0) {
            return {...voucher, reasons: reasons};
        }
        return null;
    }

    static getAnomaliesFromVouchersMap(vouchersMap: CachedVouchersMap): CachedAnomaly[] {
        const anomalies: CachedAnomaly[] = [];
        const vouchers = Array.from(vouchersMap.values());
        for (const voucher of vouchers) {
            const anomaly: CachedAnomaly | null = InspectionsManager.getAnomalyFromVoucher(voucher);
            if (anomaly != null) {
                anomalies.push(anomaly);
            }
        }
        return anomalies;
    }

    private async addCheckToMap(check: InspectionCheck, inspectionId: number, acquireMutex: boolean, errorIfPresent: boolean) {
        let unlock: (() => void) | null = null;
        if (acquireMutex) {
            unlock = await this.#inspectionMutex.lock();
        }
        let err: Error | null = null;
        try {
            if (errorIfPresent) {
                const vouchersMap: CachedVouchersMap | undefined = this.#inspectionsCache[inspectionId];
                if (vouchersMap != null && vouchersMap.has(check.voucherHistory.voucherId)) {
                    if (InspectionsManager.isAlreadyChecked(check, vouchersMap)) {
                        throw new Error("Veicolo già rilevato");
                    }
                }
            }
            const vouchersMap: CachedVouchersMap | undefined = this.#inspectionsCache[inspectionId];
            if (vouchersMap == null) {
                throw new Error("Ispezione non presente in cache");
            }
            const anomaly = InspectionsManager.addCheckToVouchersMap(check, vouchersMap);
            return anomaly;
        } catch (e) {
            err = (e as Error) ?? new Error("Errore durante l'aggiunta del rilievo");
        } finally {
            if (unlock != null) {
                unlock();
            }
        }
        if (err) {
            throw err;
        }
    }

    private async removeCheckFromMap(checkId: number, voucherId: number, inspectionId: number, acquireMutex: boolean) {
        let unlock: (() => void) | null = null;
        if (acquireMutex) {
            unlock = await this.#inspectionMutex.lock();
        }
        try {
            const vouchersMap: CachedVouchersMap | undefined = this.#inspectionsCache[inspectionId];
            if (vouchersMap == null) {
                throw new Error("Ispezione non presente in cache");
            }
            InspectionsManager.removeCheckFromVouchersMap(checkId, voucherId, vouchersMap);
        } catch (e) {
            throw e;
        } finally {
            if (unlock != null) {
                unlock();
            }
        }
    }

    public async addCheckToInspection(check: InspectionCheck, inspectionId: number) {
        return await this.addCheckToMap(check, inspectionId, true, true);
    }

    public async removeCheckFromInspection(checkId: number, voucherId: number, inspectionId: number) {
        await this.removeCheckFromMap(checkId, voucherId, inspectionId, true);
    }

    public async addInspectionToMap(inspection: InspectionDetails) {
        await this.#inspectionMutex.runExclusive(async () => {
            const vouchersMap: CachedVouchersMap = new Map();
            for (const check of inspection.inspectionChecks) {
                InspectionsManager.addCheckToVouchersMap(check, vouchersMap);
            }
            this.#inspectionsCache[inspection.id] = vouchersMap;
        });
    }

    static getAnomaliesFromEndedInspection(inspection: InspectionDetails) {
        const vouchersMap: CachedVouchersMap = new Map();
        for (const check of inspection.inspectionChecks) {
            InspectionsManager.addCheckToVouchersMap(check, vouchersMap);
        }
        return InspectionsManager.getAnomaliesFromVouchersMap(vouchersMap);
    }

    public async getAnomaliesFromOngoingInspection(inspectionId: number) {
        return await this.#inspectionMutex.runExclusive(async () => {
            const vouchersMap: CachedVouchersMap | undefined = this.#inspectionsCache[inspectionId];
            if (vouchersMap == null) {
                throw new Error("Ispezione non presente in cache");
            }
            return InspectionsManager.getAnomaliesFromVouchersMap(vouchersMap);
        });
    }

    public async addNewInspectionToMap(inspectionId: number) {
        await this.#inspectionMutex.runExclusive(async () => {
            const vouchersMap: CachedVouchersMap = new Map();
            if (this.#inspectionsCache[inspectionId] != null) {
                throw new Error("Ispezione già presente in cache");
            }
            this.#inspectionsCache[inspectionId] = vouchersMap;
        });
    }

    public async removeInspectionFromMap(inspectionId: number) {
        await this.#inspectionMutex.runExclusive(async () => {
            delete this.#inspectionsCache[inspectionId];
        });
    }

    public async loadInspections() {
        const db = DatabaseManager.instance.db;

        const ongoingInspectionsDetails = await db.transaction(async (tx) => {
            const ongoingInspections = await getDetailedOngoingInspectionsFull(tx);
            const ongoingInspectionsDetails: InspectionDetails[] = await getOngoingInspectionsDetails(ongoingInspections);
            return ongoingInspectionsDetails;
        });
        if (ongoingInspectionsDetails == null) {
            throw new Error("Errore nel recupero delle ispezioni dal DB");
        }

        for (const inspection of ongoingInspectionsDetails) {
            await this.addInspectionToMap(inspection);
        }
    }


}
