import fs from "fs";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import AggregatorDatabase from "./src/db/aggregator-database";
import DatabaseContext from "./src/db/interfaces/database-context";
import { DB_TYPES } from "./src/db/inversify.types";
import { Resolver } from "./src/inversify.config";
import router from "./src/routes/index";
import ServiceManager from "./src/service/service-manager";
import { SERVICE_TYPES } from "./src/service/inversify.types";
import { Service } from "./src/service/types";
import SocketHub from "./src/socket/interfaces/socket-hub";
import { SOCKET_TYPES } from "./src/socket/inversify.types";

const app: Application = express();
dotenv.config();

app.use(bodyParser.json());
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const port: number = Number.parseInt(process.env.COMBILOG_PORT ?? "8090");

// MAIN API ROUTES
app.use("/api", router);

async function main() {
  await setupSockerRegister();
  const initialServiceFile =
    process.env.COMBILOG_AGGREGATOR_INITIAL_SERVICE_FILE;
  if (initialServiceFile) {
    fs.readFile(initialServiceFile, "utf8", (err, data) => {
      if (err) {
        console.error(`Could not parse initial services files. Error: ${err}`);
      } else {
        const services: Service[] = JSON.parse(data);
        const serviceManager = Resolver.get<ServiceManager>(
          SERVICE_TYPES.ServiceManager
        );
        for (const service of services) {
          serviceManager
            .registerService(service.friendlyName, service.secret)
            .then((createdService) => {
              if (createdService) {
                console.log(`Created Service: ${service.friendlyName}`);
              } else {
                console.log("Error creating service.");
              }
            });
        }
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
