import { Service } from "../../service/types";

export default interface ServiceDataHandler {
  addNewService(service: Service): Promise<void>;

  getServiceByID(serviceID: string): Promise<Service | null>;

  getServiceBySecret(secret: string): Promise<Service | null>;

  getServiceByFriendlyName(friendlyName: string): Promise<Service | null>;

  getAllServices(): Promise<Service[] | null>;

  setServiceOnlineStatus(id: string, status: boolean): Promise<boolean>;
}
