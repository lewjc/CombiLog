import AggregatorDatabase from "./AggregatorDatabase";
import { r, Connection, isCursor } from "rethinkdb-ts";
import { Service } from "../service/types";
import ServiceDataHandler from "./interfaces/ServiceDataHandler";
import { inject, injectable } from "inversify";
import { DB_TYPES } from "./inversify.types";
import DatabaseContext from "./interfaces/DatabaseContext";

@injectable()
export default class ServiceBridge implements ServiceDataHandler {
	private readonly db: DatabaseContext;

	constructor(@inject(DB_TYPES.AggreagtorDatabase) db: DatabaseContext) {
		this.db = db;
	}

	public async addNewService(service: Service): Promise<void> {
		return this.db.connect(this.db.info.name).then((connection: Connection) => {
			return r
				.table(this.db.info.tableNames.service)
				.insert(service)
				.run(connection)
				.then((result) => {
					if (result.inserted === 0) {
						console.error(
							`Failed to register service, does this record already exist in the database? ${service}`
						);
					} else {
						`Service: ${service.friendlyName} registered with secret ${service.secret}`;
					}
				})
				.catch((error) => {
					console.error("An error occured whilst adding a service to the database." + error);
				})
				.finally(() => {
					this.db.close(connection);
				});
		});
	}

	async getServiceByID(serviceID: string): Promise<Service | null> {
		return this.db.connect().then((connection: Connection) => {
			return r
				.table(this.db.info.tableNames.service)
				.filter(r.row("id").eq(serviceID))
				.run(connection)
				.then((array: Array<any>) => {
					if (array.length === 1) {
						// Found the service, return a Service Object.
						console.log(array);
					}
					// Was not found, return undefined
					return null;
				})
				.catch((err) => {
					console.error(err);
					return null;
				})
				.finally(() => {
					connection.close();
				});
		});
	}

	async getServiceBySecret(secret: string): Promise<Service | null> {
		return this.db.connect(this.db.info.name).then((connection: Connection) => {
			return r
				.table(this.db.info.tableNames.service)
				.filter(r.row("secret").eq(secret))
				.run(connection)
				.then((array: Array<any>) => {
					if (array.length === 1) {
						return array[0] as Service;
					}
					return null;
				})
				.catch((err) => {
					console.error(err);
					return null;
				})
				.finally(() => {
					connection.close();
				});
		});
	}

	async getAllServices(): Promise<Service[] | null> {
		return this.db.connect(this.db.info.name).then((connection: Connection) => {
			return r
				.table(this.db.info.tableNames.service)
				.run(connection)
				.then((values) => {
					return values as Service[];
				})
				.catch((err) => {
					console.error(err);
					return null;
				})
				.finally(() => {
					connection.close();
				});
		});
	}

	async setServiceOnlineStatus(id: string, status: boolean): Promise<boolean> {
		return this.db.connect(this.db.info.name).then((connection: Connection) => {
			return r
				.table(this.db.info.tableNames.service)
				.get(id)
				.update({ online: status })
				.run(connection)
				.then((x) => {
					if (x.changes && x.changes.length > 0) {
						return true;
					} else {
						return false;
					}
				})
				.catch((err) => {
					console.error(err);
					return false;
				})
				.finally(() => {
					connection.close();
				});
		});
	}
}
