import { Connection } from "rethinkdb-ts";
import { DatabaseInfo } from "../types";

export default interface DatabaseContext {
	readonly info: DatabaseInfo;
	readonly tableKeys: object;

	initialiseDatabase(): Promise<void | void[]>;

	connect(db?: string): Promise<Connection>;

	close(connection: Connection): Promise<void>;

	createDatabase(connection: Connection, name: string): Promise<void>;

	createTable(connection: Connection, databaseName: string, tableName: string): Promise<void>;
}
