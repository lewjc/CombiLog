import { Service } from "../types";

export default interface ServiceManagement {
	registerService(friendlyName: string): Promise<Service | null>;
	findServiceBySecret(secret: string): Promise<Service | null>;
	getAllServices(): Promise<Service[] | null>;
	setServiceStatus(id: string, status: boolean): Promise<boolean>;
}
