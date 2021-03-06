import express, { Application, Request, Response } from "express";
import fs from "fs";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import AggregatorDatabase from "./src/db/AggregatorDatabase";
import router from "./src/routes/index";
import SocketManager from "./src/socket/SocketManager";
import ServiceManager from "./src/service/ServiceManager";
import MessageManager from "./src/messages/MessageManager";
import MessageBridge from "./src/db/MessageBridge";
import ServiceBridge from "./src/db/ServiceBridge";
import cors from "cors";
import { Resolver } from "./src/inversify.config";
import { DB_TYPES } from "./src/db/inversify.types";
import DatabaseContext from "./src/db/interfaces/DatabaseContext";
import SocketHub from "./src/socket/interfaces/SocketHub";
import { SOCKET_TYPES } from "./src/socket/inversify.types";
import { Service } from "./src/service/types";
import { MESSAGE_TYPES } from "./src/messages/inversify.types";
import { SERVICE_TYPES } from "./src/service/inversify.types";
import e from "express";

const app: Application = express();
dotenv.config();

app.use(bodyParser.json());
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const port: number = parseInt(process.env.COMBILOG_PORT ?? "8090");

// MAIN API ROUTES
app.use("/api", router);

async function main() {
  const socketRegister = await setupSockerRegister();
  const initialServiceFile =
    process.env.COMBILOG_AGGREGATOR_INITIAL_SERVICE_FILE;
  if (initialServiceFile) {
    fs.readFile(initialServiceFile, "utf8", function (err, data) {
      if (err) {
        console.error(`Could not parse initial services files. Error: ${err}`);
      } else {
        const services: Service[] = JSON.parse(data);
        const serviceManager = Resolver.get<ServiceManager>(
          SERVICE_TYPES.ServiceManager
        );
        services.forEach((service) => {
          const createdService = serviceManager.registerService(
            service.friendlyName,
            service.secret
          );
          if (createdService) {
            console.log(`Created Service: ${service.friendlyName}`);
          } else {
            console.log("Error creating service.");
          }
        });
      }
    });
  }

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

async function setupSockerRegister(): Promise<SocketHub> {
  const db: AggregatorDatabase = Resolver.get<DatabaseContext>(
    DB_TYPES.AggreagtorDatabase
  );

  return db.initialiseDatabase().then(() => {
    return Resolver.get<SocketHub>(SOCKET_TYPES.SocketManager);
  });
}

main();
