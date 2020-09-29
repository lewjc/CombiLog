import express, { Router, Request, Response } from "express";
import { SERVICE_TYPES } from "../../service/inversify.types";
import { Service } from "../../service/types";
import { Resolver } from "../../inversify.config";
import ServiceManagement from "../../service/interfaces/ServiceManagement";

const router: Router = express.Router();
// POST /service/add
router.post("/add", async (req: Request, res: Response) => {
	if (req.body["friendlyName"]) {
		const register: ServiceManagement = Resolver.get<ServiceManagement>(
			SERVICE_TYPES.ServiceManager
		);
		const service = await register.registerService(req.body.friendlyName);

		if (service) {
			res.status(201).json({
				message: "Registered service sucessfully.",
				service: service,
			});
		} else {
			res.status(500).json({
				message: "An error occured, please check the aggregator logs.",
				service: service,
			});
		}
	} else {
		res.status(400).json({
			message: "No designated friendly name passed in request body.",
		});
	}
});

router.get("/all", async (req: Request, res: Response) => {
	const manager: ServiceManagement = Resolver.get<ServiceManagement>(SERVICE_TYPES.ServiceManager);
	const allServices = await manager.getAllServices();

	if (!allServices) {
		res.status(500).json({
			message: "An error occured, please check the aggregator logs.",
		});
	} else {
		res.status(200).json({
			services: allServices,
		});
	}
});

function isService(body: any): body is Service {
	const potentialType = body as Service;
	return potentialType.friendlyName !== undefined && potentialType.secret !== undefined;
}

router.get("/heartbeat", async (req: Request, res: Response) => {
	res.send("beep");
});

export default router;
