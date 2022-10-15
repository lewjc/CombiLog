import { ColourRule, Settings } from "settings";

export interface SettingsDataHandler {
  getSettings(): Promise<Settings | null>;
  getColourRules(): Promise<Array<ColourRule> | null>;
  addColourRule(rule: ColourRule): Promise<boolean>;
  updateColourRule(rule: ColourRule): Promise<boolean>;
  deleteColourRuleByName(name: string): Promise<boolean>;
}
