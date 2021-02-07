import { ColourRule, Settings } from "../types";

export default interface SettingsManagement {
  getSettings(): Promise<Settings | null>;
  getColourRules(): Promise<ColourRule[] | null>;
  addColourRule(colourRule: ColourRule): Promise<boolean>;
  deleteColourRuleByName(name: string): Promise<boolean>;
  updateColourRule(colourRule: ColourRule): Promise<boolean>;
}
