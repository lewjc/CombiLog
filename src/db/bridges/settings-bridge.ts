import { inject, injectable } from "inversify";
import { r } from "rethinkdb-ts";
import { DatabaseContext, SettingsDataHandler } from "../interfaces";
import { DB_TYPES } from "../inversify.types";
import { SETTINGS_OBJECT_ID } from "settings";
import { ColourRule, Settings } from "settings";

@injectable()
export class SettingsBridge implements SettingsDataHandler {
  private readonly db: DatabaseContext;

  public constructor(@inject(DB_TYPES.AggreagtorDatabase) db: DatabaseContext) {
    this.db = db;
  }

  public async getSettings(): Promise<Settings | null> {
    const connection = await this.db.connect(this.db.info.name);
    try {
      return await r
        .table(this.db.info.tableNames.settings)
        .run(connection)
        .then((settings: Array<any>) => settings?.pop())
        .then((setting) => setting as Settings);
    } catch (error) {
      console.error("An error occured getting the colour rules " + error);
      return null;
    }
  }

  public async getColourRules(): Promise<ColourRule[] | null> {
    const connection = await this.db.connect(this.db.info.name);
    try {
      return await r
        .table(this.db.info.tableNames.settings)
        .run(connection)
        .then((settings: Array<any>) => settings?.pop())
        .then((setting) => (setting as Settings).colourRules);
    } catch (error) {
      console.error("An error occured getting the colour rules " + error);
      return null;
    }
  }

  public async addColourRule(rule: ColourRule): Promise<boolean> {
    const connection = await this.db.connect(this.db.info.name);
    return r
      .table(this.db.info.tableNames.settings)
      .get(SETTINGS_OBJECT_ID)
      .update({ colourRules: r.row("colourRules").append(rule) })
      .run(connection)
      .then((result) => {
        return result.replaced ? true : false;
      })
      .catch((error) => {
        console.error("An error occured creating a colour rule " + error);
        return false;
      });
  }

  public async updateColourRule(rule: ColourRule): Promise<boolean> {
    const connection = await this.db.connect(this.db.info.name);
    return r
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
        return result.deleted || result.replaced ? true : false;
      })
      .catch((error) => {
        console.error("An error occured creating a colour rule " + error);
        return false;
      });
  }

  public async deleteColourRuleByName(name: string): Promise<boolean> {
    const connection = await this.db.connect(this.db.info.name);
    return r
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
        return result.deleted || result.replaced ? true : false;
      })
      .catch((error) => {
        console.error("An error occured creating a colour rule " + error);
        return false;
      });
  }
}
