import "reflect-metadata";
import SettingsManagement from "./interfaces/SettingsManagement";
import { inject, injectable } from "inversify";
import { DB_TYPES } from "../db/inversify.types";
import SettingsDataHandler from "../db/interfaces/SettingsDataHandler";
import { ColourRule, Settings } from "./types";
import e from "express";

@injectable()
export default class SettingsManager implements SettingsManagement {
  private readonly _settingsBridge: SettingsDataHandler;

  constructor(
    @inject(DB_TYPES.SettingsBridge) settingsBridge: SettingsDataHandler
  ) {
    this._settingsBridge = settingsBridge;
  }
  async updateColourRule(rule: ColourRule): Promise<boolean> {
    return this._settingsBridge.updateColourRule(rule);
  }

  async deleteColourRuleByName(name: string): Promise<boolean> {
    return this._settingsBridge.deleteColourRuleByName(name);
  }

  async getSettings(): Promise<Settings | null> {
    return this._settingsBridge.getSettings();
  }

  async addColourRule(colourRule: ColourRule): Promise<boolean> {
    return this._settingsBridge.addColourRule(colourRule);
  }
  async getColourRules(): Promise<ColourRule[] | null> {
    return this._settingsBridge.getColourRules();
  }
}
