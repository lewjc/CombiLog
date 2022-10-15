import express, { Router, Request, Response } from "express";
import { Resolver } from "inversify.config";
import { SettingsManagement, SETTINGS_TYPES, isColourRule } from "settings";

const router: Router = express.Router();

router.get("/all", async (req: Request, res: Response) => {
  const settingsManager: SettingsManagement = Resolver.get<SettingsManagement>(
    SETTINGS_TYPES.SettingsManager
  );

  const settings = await settingsManager.getSettings();

  if (settings) {
    res.status(200).json({
      settings,
    });
  } else {
    res.status(400).json({
      message: "No settings found. Please check aggreagtor logs.",
    });
  }
});

router.post("/add-colour-rule", async (req: Request, res: Response) => {
  const rule = req.body["colourRule"];

  if (isColourRule(rule)) {
    const settingsManager: SettingsManagement =
      Resolver.get<SettingsManagement>(SETTINGS_TYPES.SettingsManager);

    const success = await settingsManager.addColourRule(rule);

    if (success) {
      res.status(201).json({
        message: "Created colour rule successfully.",
        colourRule: rule,
      });
    } else {
      res.status(500).json({
        message: "An error occured, please check the aggregator logs.",
      });
    }
  } else {
    res.status(400).json({
      message:
        "Data passed to body failed type check. Please ensure you are passing an object of Type ColourRule.",
    });
  }
});

router.get("/colour-rules", async (req: Request, res: Response) => {
  const settingsManager: SettingsManagement = Resolver.get<SettingsManagement>(
    SETTINGS_TYPES.SettingsManager
  );

  const colourRules = await settingsManager.getColourRules();

  if (colourRules) {
    res.status(200).json({
      colourRules,
    });
  } else {
    res.status(200).json({
      message: "No colour rules found.",
    });
  }
});

router.delete("/colour-rules/:name", async (req: Request, res: Response) => {
  const ruleName: string = req.params.name;

  if (ruleName) {
    const settingsManager: SettingsManagement =
      Resolver.get<SettingsManagement>(SETTINGS_TYPES.SettingsManager);
    const success = await settingsManager.deleteColourRuleByName(ruleName);

    if (success) {
      res.status(201).json({
        message: `Deleted colour rule ${ruleName} successfully.`,
      });
    } else {
      res.status(500).json({
        message: "An error occured, please check the aggregator logs.",
      });
    }
  } else {
    res.status(400).json({
      message: "Missing name parameter in the request path.",
    });
  }
});

router.patch("/edit-colour-rule", async (req: Request, res: Response) => {
  const rule = req.body["colourRule"];
  if (isColourRule(rule)) {
    const settingsManager: SettingsManagement =
      Resolver.get<SettingsManagement>(SETTINGS_TYPES.SettingsManager);

    const success = await settingsManager.updateColourRule(rule);

    if (success) {
      res.status(200).json({
        message: "Updated colour rule successfully.",
        colourRule: rule,
      });
    } else {
      res.status(500).json({
        message: "An error occured, please check the aggregator logs.",
      });
    }
  } else {
    res.status(400).json({
      message:
        "Data passed to body failed type check. Please ensure you are passing an object of Type ColourRule.",
    });
  }
});

export default router;
