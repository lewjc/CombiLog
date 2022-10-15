import { Connection } from "rethinkdb-ts";
import { Settings } from "settings/types";
import { DatabaseInfo } from "../types";

export interface DatabaseContext {
  readonly info: DatabaseInfo;
  readonly defaultSettingsObject: Settings;

  initialiseDatabase(): Promise<void | void[]>;

  connect(db?: string): Promise<Connection>;

  close(connection: Connection): Promise<void>;

  createDatabase(connection: Connection, name: string): Promise<void>;

  createTable(
    connection: Connection,
    databaseName: string,
    tableName: string
  ): Promise<void>;

  initialiseSettingsTable(
    connection: Connection,
    resolve: (value: void | PromiseLike<void>) => void,
    reject: () => void
  ): Promise<void>;
}
