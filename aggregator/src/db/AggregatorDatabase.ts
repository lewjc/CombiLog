import { r, RConnectionOptions, Connection, DBChangeResult } from "rethinkdb-ts";
import EnvironmentError from "../error/EnvironmentError";
import { DatabaseInfo, TableNames } from "./types";
import { SocketMessage } from "../messages/types";
import DatabaseContext from "./interfaces/DatabaseContext";
import { injectable } from "inversify";

@injectable()
export default class AggregatorDatabase implements DatabaseContext {
	static readonly SERVICE_DATABASE_NAME: string = "COMBILOG_SERVICES";
	static readonly MESSAGE_DATABASE_NAME: string = "COMBILOG_MESSAGES";

	readonly info: DatabaseInfo;
	readonly tableKeys: object = {};

	private host?: string;
	private port?: number;
	private username?: string;
	private password?: string;

	/**
	 * Interfaces with the database. Requires four environment variables to be set:
	 *  - RETHINK_HOST
	 *  - RETHINK_USER
	 *  - RETHINK_PASSWORD
	 *  - RETHINK_PORT
	 */
	constructor() {
		this.host = process.env.RETHINK_HOST;
		this.username = process.env.RETHINK_USER;
		this.password = process.env.RETHINK_PASSWORD ?? "";
		this.port = parseInt(process.env.RETHINK_PORT ?? "");

		if (!this.host) {
			throw new EnvironmentError(EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_HOST"));
		}
		if (!this.username) {
			throw new EnvironmentError(EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_USER"));
		}

		if (isNaN(this.port)) {
			throw new EnvironmentError(EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_PORT"));
		}

		this.info = {
			name: "COMBILOG_SERVICES",
			tableNames: {
				message: "MESSAGE",
				service: "SERVICE",
			},
		};
	}

	/**
	 * Checks the rethink instance to determine whether or not the database is in a suitable startup state. Should be called on app startup.
	 */
	public async initialiseDatabase(): Promise<void | void[]> {
		console.log("BEGINNING DATABASE SCHEMA CHECK");
		const connection = await this.connect();
		return r
			.dbList()
			.run(connection)
			.then(async (dbs: Array<string>) => {
				if (!dbs.includes(this.info.name)) {
					await this.createDatabase(connection, this.info.name);
				} else {
					console.info(`Database ${this.info.name} exists.`);
				}
			})
			.then(() => {
				connection.use(this.info.name);
				return r.db(this.info.name).tableList().run(connection);
			})
			.then((tableNames) => {
				const addTablePromises: Promise<void>[] = [];
				Object.values(this.info.tableNames).forEach(async (tableName) => {
					if (!tableNames.includes(tableName)) {
						const addTablePromise = new Promise<void>((resolve, reject) => {
							this.createTable(connection, this.info.name, tableName).then(resolve);
						});
						addTablePromises.push(addTablePromise);
					} else {
						console.log(`Table ${tableName} exists in ${this.info.name}.`);
					}
				});
				return Promise.all(addTablePromises);
			})
			.catch((error: Error) => {
				console.error("AN ERROR OCCURED DURING DATABASE SETUP AND VALIDATION: " + error);
			})
			.finally(() => {
				console.info("Database init check complete!");
				this.close(connection);
			});
	}

	async connect(db: string = "test"): Promise<Connection> {
		const connectionOptions: RConnectionOptions = {
			host: this.host,
			port: this.port,
			user: this.username,
			db: db,
			password: this.password,
		};

		return r.connect(connectionOptions);
	}

	async close(connection: Connection): Promise<void> {
		try {
			return await connection.close();
		} catch (e) {
			// TODO: Logging
			return new Promise<void>(() => console.error(e));
		}
	}

	async createDatabase(connection: Connection, name: string): Promise<void> {
		return r
			.dbCreate(name)
			.run(connection)
			.then((result: DBChangeResult) => {
				if (result.dbs_created !== 1) {
					console.error(`Database ${name} already exists.`);
				} else {
					console.info(`Successfuly created database ${name}.`);
				}
			});
	}

	async createTable(
		connection: Connection,
		databaseName: string,
		tableName: string
	): Promise<void> {
		return r
			.db(databaseName)
			.tableCreate(tableName)
			.run(connection)
			.then((result) => {
				if (result.tables_created !== 1) {
					console.error(`Table ${tableName} already exists.`);
				} else {
					console.info(`Successfuly created table ${tableName} in ${databaseName}.`);
				}
			});
	}
}
