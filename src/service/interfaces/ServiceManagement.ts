import { Service } from "../types";

export default interface ServiceManagement {
  registerService(
    friendlyName: string,
    secret?: string
  ): Promise<Service | null>;
  findServiceBySecret(secret: string): Promise<Service | null>;
  getAllServices(): Promise<Service[] | null>;
  isFriendlyNameRegistered(friendlyName: string): Promise<boolean>;
  setServiceStatus(id: string, status: boolean): Promise<boolean>;
}
