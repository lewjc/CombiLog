import "reflect-metadata";
import { v4 as uuid } from "uuid";
import { Service } from "./types";
import { ServiceManagement } from "./interfaces/service-management";
import cryptoRandomString from "crypto-random-string";
import { inject, injectable } from "inversify";
import { ServiceDataHandler, DB_TYPES } from "../db";

@injectable()
export class ServiceManager implements ServiceManagement {
  private _serviceBridge: ServiceDataHandler;

  constructor(
    @inject(DB_TYPES.ServiceBridge) serviceBridge: ServiceDataHandler
  ) {
    this._serviceBridge = serviceBridge;
  }

  /**
   * Registers a service in the aggregator
   * @param url The url of the service.
   * @returns The id of the service socket
   */

  async registerService(
    friendlyName: string,
    secret?: string
  ): Promise<Service | null> {
    let mySecret: string;
    if (secret) {
      mySecret = secret;
    } else {
      mySecret = cryptoRandomString({
        length: 16,
        type: "url-safe",
      });
    }
    const id: string = uuid();

    try {
      const service: Service = {
        id: id,
        friendlyName: friendlyName,
        secret: mySecret,
        dateAdded: new Date().toISOString(),
        eventCount: 0,
      };
      await this._serviceBridge.addNewService(service);
      console.log(`Created new service: ${JSON.stringify(service)}`);
      return service;
    } catch (e) {
      console.error(
        "An error occured. It may be to do with adding a service to the service database: " +
          e
      );
    }

    return null;
  }

  async isFriendlyNameRegistered(friendlyName: string): Promise<boolean> {
    const service = await this._serviceBridge.getServiceByFriendlyName(
      friendlyName
    );
    console.log(service);
    if (service !== null) {
      console.error(`Service already exists for friendly name ${friendlyName}`);
      return true;
    } else {
      return false;
    }
  }

  async findServiceBySecret(secret: string): Promise<Service | null> {
    return this._serviceBridge.getServiceBySecret(secret);
  }

  async getAllServices(): Promise<Service[] | null> {
    return this._serviceBridge.getAllServices();
  }

  async setServiceStatus(id: string, status: boolean): Promise<boolean> {
    return this._serviceBridge.setServiceOnlineStatus(id, status);
  }
}
