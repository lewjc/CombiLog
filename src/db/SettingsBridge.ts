import { r } from "rethinkdb-ts";
import SettingsDataHandler from "./interfaces/SettingsDataHandler";
import { inject, injectable } from "inversify";
import { DB_TYPES } from "./inversify.types";
import DatabaseContext from "./interfaces/DatabaseContext";
import { MessageType } from "../messages/enums/MessageType";
import { ColourRule, Settings } from "../settings/types";
import { SETTINGS_OBJECT_ID } from "../settings/constants/constants";

@injectable()
export default class SettingsBridge implements SettingsDataHandler {
  private readonly db: DatabaseContext;

  constructor(@inject(DB_TYPES.AggreagtorDatabase) db: DatabaseContext) {
    this.db = db;
  }

  async getSettings(): Promise<Settings | null> {
    const connection = await this.db.connect(this.db.info.name);
    try {
      return r
        .table(this.db.info.tableNames.settings)
        .run(connection)
        .then((settings: Array<any>) => settings?.pop())
        .then((setting) => setting as Settings);
    } catch (error) {
      console.error("An error occured getting the colour rules " + error);
      return null;
    }
  }

  async getColourRules(): Promise<ColourRule[] | null> {
    const connection = await this.db.connect(this.db.info.name);
    try {
      return r
        .table(this.db.info.tableNames.settings)
        .run(connection)
        .then((settings: Array<any>) => settings?.pop())
        .then((setting) => (setting as Settings).colourRules);
    } catch (error) {
      console.error("An error occured getting the colour rules " + error);
      return null;
    }
  }

  async addColourRule(rule: ColourRule): Promise<boolean> {
    const connection = await this.db.connect(this.db.info.name);
    return await r
      .table(this.db.info.tableNames.settings)
      .get(SETTINGS_OBJECT_ID)
      .update({ colourRules: r.row("colourRules").append(rule) })
      .run(connection)
      .then((result) => {
        if (result.replaced) {
          return true;
        } else {
          return false;
        }
      })
      .catch((error) => {
        console.error("An error occured creating a colour rule " + error);
        return false;
      });
  }

  async updateColourRule(rule: ColourRule): Promise<boolean> {
    const connection = await this.db.connect(this.db.info.name);
    return await r
      .table(this.db.info.tableNames.settings)
      .get(SETTINGS_OBJECT_ID)
      .update({
        colourRules: r
          .row("colourRules")
          .filter((storedRule) => storedRule("name").ne(rule.name))
          .append(rule),
      })
      .run(connection)
      .then((result) => {
        console.log(result);
        if (result.deleted || result.replaced) {
          return true;
        } else {
          return false;
        }
      })
      .catch((error) => {
        console.error("An error occured creating a colour rule " + error);
        return false;
      });
  }

  async deleteColourRuleByName(name: string): Promise<boolean> {
    const connection = await this.db.connect(this.db.info.name);
    return await r
      .table(this.db.info.tableNames.settings)
      .get(SETTINGS_OBJECT_ID)
      .update({
        colourRules: r
          .row("colourRules")
          .filter((rule) => rule("name").ne(name)),
      })
      .run(connection)
      .then((result) => {
        console.log(result);
        if (result.deleted || result.replaced) {
          return true;
        } else {
          return false;
        }
      })
      .catch((error) => {
        console.error("An error occured creating a colour rule " + error);
        return false;
      });
  }
}
