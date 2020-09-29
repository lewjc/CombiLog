import express, { Application, Request, Response } from "express";
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
	app.listen(port, () => {
		console.log(`Listening on port ${port}`);
	});
}

async function setupSockerRegister(): Promise<SocketHub> {
	const db: AggregatorDatabase = Resolver.get<DatabaseContext>(DB_TYPES.AggreagtorDatabase);

	return db.initialiseDatabase().then(() => {
		return Resolver.get<SocketHub>(SOCKET_TYPES.SocketManager);
	});
}

main();
