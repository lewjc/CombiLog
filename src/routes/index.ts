import * as express from "express";
import service from "./service/index";
import message from "./message/index";
import setting from "./setting/index";
import { Request, Response } from "express";
import { VERSION } from "../version";

export const router: express.Router = express.Router();

router.use("/service", service);
router.use("/message", message);
router.use("/setting", setting);

router.get("/version", async (_req: Request, res: Response) => {
  res.status(200).json({
    VERSION,
  });
});
