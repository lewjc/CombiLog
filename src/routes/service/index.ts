import express, { Router, Request, Response } from "express";
import { Resolver } from "inversify.config";
import { Service, ServiceManagement, SERVICE_TYPES } from "service";

const router: Router = express.Router();
// POST /service/add
router.post("/add", async (req: Request, res: Response, next) => {
  const friendlyName = req.body["friendlyName"];
  const secret = req.body["secret"];
  if (friendlyName) {
    if (RegExp(/^[0-9A-Za-z\s\-]+$/).test(friendlyName)) {
      const register: ServiceManagement = Resolver.get<ServiceManagement>(
        SERVICE_TYPES.ServiceManager
      );
      const isFriendlyNameRegistered = await register.isFriendlyNameRegistered(
        friendlyName
      );

      if (isFriendlyNameRegistered) {
        res.status(400).json({
          message: `Service with friendly name: ${friendlyName} already registered.`,
        });
        return next();
      }

      const service = await register.registerService(
        req.body.friendlyName,
        secret
      );

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

  return next();
});

router.post("/bulk-add", async (req: Request, res: Response) => {
  try {
    const createdServices: Array<Service | null> = [];
    const services: Service[] = req.body["services"];
    const errors: string[] = [];
    let isInternalServerError = false;

    for (const service of services) {
      if (RegExp(/^[0-9A-Za-z\s\-]+$/).test(service.friendlyName)) {
        const register: ServiceManagement = Resolver.get<ServiceManagement>(
          SERVICE_TYPES.ServiceManager
        );

        if (await register.isFriendlyNameRegistered("friendlyName")) {
          errors.push(
            `Service with friendly name: ${service.friendlyName} already registered.`
          );
        } else {
          const createdService = await register.registerService(
            service.friendlyName,
            service.secret
          );
          if (createdService) {
            createdServices.push(createdService);
          } else {
            errors.push("An error occured, please check the aggregator logs.");
            isInternalServerError = true;
          }
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
  } catch (e) {
    console.error(e);
    res.status(500).json({
      errors: ["An internal server error occured. Please check the logs."],
    });
  }
});

router.get("/all", async (_req: Request, res: Response) => {
  const manager: ServiceManagement = Resolver.get<ServiceManagement>(
    SERVICE_TYPES.ServiceManager
  );
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

router.get("/heartbeat", async (_req: Request, res: Response) => {
  res.send("beep");
});

export function isService(body: unknown): body is Service {
  const potentialType = body as Service;
  return (
    potentialType.friendlyName !== undefined &&
    potentialType.secret !== undefined
  );
}

export default router;
