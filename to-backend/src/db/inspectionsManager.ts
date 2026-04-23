import {DatabaseManager} from "./databaseManager.ts";
import {
    getDetailedOngoingInspectionsFull,
    getOngoingInspectionsDetails,
    type InspectionCheck,
    type InspectionDetails
} from "../api/v1/inspections.ts";
import {Mutex} from "../utils/mutex.ts";


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
    voucherDurationDays: number
}

export type CachedVoucher = {
    vehicles: CachedVehicle[],
    permit: CachedPermit,
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
        }
        let found = false;
        for (const cachedVehicle of cachedVehicles) {
            if (cachedVehicle.vehicleId === toAddVehicle.vehicleId) {
                found = true;
            }
        }
        if (!found) {
            cachedVehicles.push(toAddVehicle);
        }
        vouchersMap.set(voucherHistory.voucherId, {
            vehicles: cachedVehicles,
            permit: cachedPermit,
        });
        if (cachedVehicles.length > cachedPermit.simultaneousPlatesAmount) {
            return true;
        }
        return false;
    }

    static removeCheckFromVouchersMap(checkId: number, voucherId: number, vouchersMap: CachedVouchersMap) {
        if (vouchersMap.has(voucherId)) {
            const cachedVoucher = vouchersMap.get(voucherId) as CachedVoucher;
            let cachedVehicles: CachedVehicle[] = cachedVoucher.vehicles.filter(v => v.checkId !== checkId);
            vouchersMap.set(voucherId, {
                vehicles: cachedVehicles,
                permit: cachedVoucher.permit,
            });
        } else {
            throw new Error("Voucher non trovato nella mappa");
        }
    }

    static getAnomaliesFromVouchersMap(vouchersMap: CachedVouchersMap): CachedVoucher[] {
        const anomalies: CachedVoucher[] = [];
        const vouchers = Array.from(vouchersMap.values());
        for (const voucher of vouchers) {
            if (voucher.vehicles.length > voucher.permit.simultaneousPlatesAmount) {
                anomalies.push(voucher);
            }
        }
        return anomalies;
    }

    private async addCheckToMap(check: InspectionCheck, inspectionId: number, acquireMutex: boolean) {
        let unlock: (() => void) | null = null;
        if (acquireMutex) {
            unlock = await this.#inspectionMutex.lock();
        }
        const vouchersMap: CachedVouchersMap | undefined = this.#inspectionsCache[inspectionId];
        if (vouchersMap == null) {
            throw new Error("Ispezione non presente in cache");
        }
        const anomaly = InspectionsManager.addCheckToVouchersMap(check, vouchersMap);
        if (unlock != null) {
            unlock();
        }
        return anomaly;
    }

    private async removeCheckFromMap(checkId: number, voucherId: number, inspectionId: number, acquireMutex: boolean) {
        let unlock: (() => void) | null = null;
        if (acquireMutex) {
            unlock = await this.#inspectionMutex.lock();
        }
        const vouchersMap: CachedVouchersMap | undefined = this.#inspectionsCache[inspectionId];
        if (vouchersMap == null) {
            throw new Error("Ispezione non presente in cache");
        }
        InspectionsManager.removeCheckFromVouchersMap(checkId, voucherId, vouchersMap);
        if (unlock != null) {
            unlock();
        }
    }

    public async addCheckToInspection(check: InspectionCheck, inspectionId: number) {
        return await this.addCheckToMap(check, inspectionId, true);
    }

    public async removeCheckFromInspection(checkId: number, voucherId: number, inspectionId: number) {
        await this.removeCheckFromMap(checkId, voucherId, inspectionId, true);
    }

    public async addInspectionToMap(inspection: InspectionDetails) {
        await this.#inspectionMutex.runExclusive(async () => {
            const vouchersMap: CachedVouchersMap = new Map();
            for (const check of inspection.inspectionChecks) {
                await this.addCheckToMap(check, inspection.id, false);
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
