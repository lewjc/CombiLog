import * as express from "express";

// import sub-routers
import service from "./service/index";
import message from "./message/index";
import setting from "./setting/index";

const router: express.Router = express.Router();

router.use("/service", service);
router.use("/message", message);
router.use("/setting", setting);

// Export the router
export default router;
