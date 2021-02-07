import {
  r,
  RConnectionOptions,
  Connection,
  DBChangeResult,
} from "rethinkdb-ts";
import EnvironmentError from "../error/EnvironmentError";
import { DatabaseInfo, TableNames } from "./types";
import { Settings } from "../settings/types";
import DatabaseContext from "./interfaces/DatabaseContext";
import { injectable } from "inversify";
import e from "express";
import { SETTINGS_OBJECT_ID } from "../settings/constants/constants";

@injectable()
export default class AggregatorDatabase implements DatabaseContext {
  readonly info: DatabaseInfo;
  private host?: string;
  private port?: number;
  private username?: string;
  private password?: string;
  readonly defaultSettingsObject: Settings;

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
    this.defaultSettingsObject = {
      id: SETTINGS_OBJECT_ID,
      colourRules: [],
    };

    if (!this.host) {
      throw new EnvironmentError(
        EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_HOST")
      );
    }
    if (!this.username) {
      throw new EnvironmentError(
        EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_USER")
      );
    }

    if (isNaN(this.port)) {
      throw new EnvironmentError(
        EnvironmentError.MISSING_ENVIRONMENT_VARIABLE("RETHINK_PORT")
      );
    }

    this.info = {
      name: "COMBILOG",
      tableNames: {
        message: "MESSAGE",
        service: "SERVICE",
        settings: "SETTINGS",
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
              if (tableName === this.info.tableNames.settings) {
                // Create and intialise the settings table with 1 settings object that will be used to hold the CombiLog settings.
                this.createTable(
                  connection,
                  this.info.name,
                  tableName
                ).then(() =>
                  this.initialiseSettingsTable(connection, resolve, reject)
                );
              } else {
                this.createTable(connection, this.info.name, tableName)
                  .then(resolve)
                  .catch((error) => {
                    console.error(error);
                    return reject;
                  });
              }
            });
            addTablePromises.push(addTablePromise);
          } else {
            console.log(`Table ${tableName} exists in ${this.info.name}.`);
          }
        });
        return Promise.all(addTablePromises);
      })
      .catch((error: Error) => {
        console.error(
          "AN ERROR OCCURED DURING DATABASE SETUP AND VALIDATION: " + error
        );
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

  async initialiseSettingsTable(
    connection: Connection,
    resolve: (value: void | PromiseLike<void>) => void,
    reject: (reason?: any) => void
  ): Promise<any> {
    return r
      .table(this.info.tableNames.settings)
      .insert(this.defaultSettingsObject)
      .run(connection)
      .then((result) => {
        if (result.inserted > 0) {
          resolve();
        } else {
          console.log(
            `DEVELOPER ERROR: Settings object already exists on ${this.info.tableNames.settings} table creation`
          );
          reject();
        }
      })
      .catch((error) => {
        console.log(error);
        reject();
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
          console.info(
            `Successfuly created table ${tableName} in ${databaseName}.`
          );
        }
      });
  }
}
