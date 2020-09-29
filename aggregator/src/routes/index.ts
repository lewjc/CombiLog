import * as express from "express";

// import sub-routers
import service from "./service/index";

const router: express.Router = express.Router();

router.use("/service", service);

// Export the router
export default router;
