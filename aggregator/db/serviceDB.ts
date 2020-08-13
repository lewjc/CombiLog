import rethinkdb, { ConnectionOptions, Connection, CreateResult } from "rethinkdb";
import EnvironmentError from "../error/EnvironmentError";

export default class ServiceDB {
	private readonly DB_NAME: string = "COMBILOG_SERVICES";
	private host?: string;
	private port?: number;
	private username?: string;
	private password?: string;

	/**
	 * Interfaces with the service database. Requires four environment variables to be set:
	 *  - RETHINK_HOST
	 *  - RETHINK_USER
	 *  - RETHINK_PASSWORD
	 *  - RETHINK_PORT
	 */
	constructor() {
		this.host = process.env.RETHINK_HOST;
		this.username = process.env.RETHINK_USER;
		this.password = process.env.RETHINK_PASSWORD;
		this.port = parseInt(process.env.RETHINK_PORT ?? "");

		if (!this.host) {
			throw new EnvironmentError(EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_HOST"));
		}

		if (!this.username) {
			throw new EnvironmentError(EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_USER"));
		}

		if (!this.password) {
			throw new EnvironmentError(EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_PASSWORD"));
		}

		if (isNaN(this.port)) {
			throw new EnvironmentError(EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_PORT"));
		}

		this.init();
	}

	private init() {
		this.connect().then((connection: Connection) => {
			rethinkdb
				.dbList()
				.run(connection)
				.then((dbs: Array<string>) => {
					if (!dbs.includes(this.DB_NAME)) {
						return rethinkdb
							.dbCreate(this.DB_NAME)
							.run(connection)
							.then((result: CreateResult) => {
								if (result.created !== 1) {
									console.error(`Failed to create database ${this.DB_NAME}`);
								} else {
									console.info(`Successfuly created database ${this.DB_NAME}`);
								}
							});
					}
				})
				.catch((error: Error) => {
					console.error(error);
				})
				.finally(() => this.close(connection));
		});
	}

	private async connect() {
		const connectionOptions: ConnectionOptions = {
			host: this.host,
			port: this.port,
			db: this.DB_NAME,
			user: this.username,
			password: this.password,
		};

		return await rethinkdb.connect(connectionOptions);
	}

	private async close(connection: Connection): Promise<void> {
		try {
			return await connection.close();
		} catch (e) {
			// TODO: Logging
			return new Promise<void>(() => console.error(e));
		}
	}
}
