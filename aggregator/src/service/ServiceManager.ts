import "reflect-metadata";
import { v4 as uuid } from "uuid";
import { Service } from "./types";
import ServiceManagement from "./interfaces/ServiceManagement";
import cryptoRandomString from "crypto-random-string";
import { inject, injectable } from "inversify";
import { DB_TYPES } from "../db/inversify.types";
import ServiceDataHandler from "../db/interfaces/ServiceDataHandler";

@injectable()
export default class ServiceManager implements ServiceManagement {
	private _serviceBridge: ServiceDataHandler;

	constructor(@inject(DB_TYPES.ServiceBridge) serviceBridge: ServiceDataHandler) {
		this._serviceBridge = serviceBridge;
	}

	/**
	 * Registers a service in the aggregator
	 * @param url The url of the service.
	 * @returns The id of the service socket
	 */
	async registerService(friendlyName: string): Promise<Service | null> {
		const id: string = uuid();
		const secret: string = cryptoRandomString({
			length: 16,
			type: "url-safe",
		});

		try {
			const service: Service = {
				id: id,
				friendlyName: friendlyName,
				secret: secret,
				dateAdded: new Date().toISOString(),
				eventCount: 0,
			};
			await this._serviceBridge.addNewService(service);
			console.log(`Created new service: ${service}`);
			return service;
		} catch (e) {
			console.error(
				"An error occured. It may be to do with adding a service to the service database: " + e
			);
		}

		return null;
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
