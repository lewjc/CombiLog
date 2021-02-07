export type ColourRule = {
  rule: RegExp;
  backgroundColour?: string;
  textColour?: string;
  name: string;
};

export function isColourRule(type: any): type is ColourRule {
  const potentialType = type as ColourRule;
  return potentialType.name !== null && potentialType.rule !== null;
}

export type Settings = {
  id: string;
  colourRules: Array<ColourRule> | null;
};
