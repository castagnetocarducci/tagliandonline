import {DatabaseManager} from "./databaseManager.ts";
import {
    getDetailedOngoingInspectionFull,
    getOngoingInspectionsDetails,
    type InspectionDetails
} from "../api/v1/inspections.ts";
import {Mutex} from "../utils/mutex.ts";


type CachedVehicle = {
    vehicleId: number,
    plate: string,
    model: string,
    brand: string
}

type CachedVouchersMap = Map<number, CachedVehicle[]>

/**
 * singleton
 */
export class InspectionsManager {
    static #instance: InspectionsManager;
    db;
    inspectionsCache: {
        [inspectionId: number]: {
            vouchersMap: CachedVouchersMap,
        }
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

    private addInspectionToMap(inspection: InspectionDetails) {
        this.#inspectionMutex.runExclusive(() => {
            const vouchersMap: CachedVouchersMap = new Map();
            for (const check of inspection.inspectionChecks) {
                const voucherHistory = check.voucherHistory;
                let cachedVehicles: CachedVehicle[] = [];
                if (vouchersMap.has(voucherHistory.voucherId)) {
                    cachedVehicles = vouchersMap.get(voucherHistory.voucherId) as CachedVehicle[];
                }
                const toAddVehicle: CachedVehicle = {
                    vehicleId: check.vehicleHistory.vehicleId,
                    plate: check.vehicleHistory.plate,
                    model: check.vehicleHistory.model,
                    brand: check.vehicleHistory.brand,
                };
                let found = false;
                for (const cachedVehicle of cachedVehicles) {
                    if (cachedVehicle.vehicleId === toAddVehicle.vehicleId) {
                        found = true;
                    }
                }
                if (!found) {
                    cachedVehicles.push(toAddVehicle);
                }
                vouchersMap.set(voucherHistory.voucherId, cachedVehicles);
            }

            this.inspectionsCache[inspection.id] = {
                vouchersMap: vouchersMap,
            };
        });
    }

    private removeInspectionFromMap(inspection: InspectionDetails) {
        this.#inspectionMutex.runExclusive(() => {
            delete this.inspectionsCache[inspection.id];
        });
    }

    public loadInspections = async () => {
        const db = DatabaseManager.instance.db;

        const ongoingInspectionsDetails = await db.transaction(async (tx) => {
            const ongoingInspections = await getDetailedOngoingInspectionFull(tx);
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
