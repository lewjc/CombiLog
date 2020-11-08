import express, { Router, Request, Response } from "express";
import { SERVICE_TYPES } from "../../service/inversify.types";
import { Service } from "../../service/types";
import { Resolver } from "../../inversify.config";
import ServiceManagement from "../../service/interfaces/ServiceManagement";

const router: Router = express.Router();
// POST /service/add
router.post("/add", async (req: Request, res: Response) => {
	const friendlyName = req.body["friendlyName"];
	const secret = req.body["secret"];
	if (friendlyName) {
		if (RegExp(/^[0-9A-Za-z\s\-]+$/).test(friendlyName)) {
			const register: ServiceManagement = Resolver.get<ServiceManagement>(
				SERVICE_TYPES.ServiceManager
			);
			const service = await register.registerService(req.body.friendlyName, secret);

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
				message: "Friendly name must be only letters, numbers and dashes (-)",
			});
		}
	} else {
		res.status(400).json({
			message: "No designated friendly name passed in request body.",
		});
	}
});

router.post("/bulk-add", async (req: Request, res: Response) => {
	const services: Service[] = JSON.parse(req.body);
	const createdServices: Array<Service | null> = [];
	const errors: string[] = [];
	let isInternalServerError = false;

	for (const service of services) {
		if (RegExp(/^[0-9A-Za-z\s\-]+$/).test(service.friendlyName)) {
			const register: ServiceManagement = Resolver.get<ServiceManagement>(
				SERVICE_TYPES.ServiceManager
			);
			const createdService = await register.registerService(service.friendlyName, service.secret);
			if (createdService) {
				createdServices.push(createdService);
			} else {
				errors.push("An error occured, please check the aggregator logs.");
				isInternalServerError = true;
			}
		} else {
			errors.push(
				`Friendly name ${service.friendlyName} invalid. name must be only letters, numbers and dashes (-) `
			);
		}
	}

	if (errors.length > 0) {
		if (isInternalServerError) {
			res.status(500).json({
				message: "One or more services failed registration.",
				errors,
			});
		} else {
			res.status(400).json({
				message: "One or more services failed registration.",
				errors,
			});
		}
	} else {
		res.status(201).json({
			message: "All services registered successfully.",
			services: services,
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

router.get("/heartbeat", async (req: Request, res: Response) => {
	res.send("beep");
});

function isService(body: any): body is Service {
	const potentialType = body as Service;
	return potentialType.friendlyName !== undefined && potentialType.secret !== undefined;
}

export default router;
