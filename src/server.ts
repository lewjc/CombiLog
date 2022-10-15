import fs from "fs";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import { Service, ServiceManager, SERVICE_TYPES } from "service";
import { router } from "routes";
import { Resolver } from "inversify.config";
import { AggregatorDatabase, DatabaseContext, DB_TYPES } from "db";
import { SocketHub, SOCKET_TYPES } from "socket";

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
