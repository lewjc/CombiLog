import { ConsumerSocket } from "../socket/types";
import { SocketMessage } from "../messages/types";
import { r } from "rethinkdb-ts";
import MessageDataHandler from "./interfaces/MessageDataHandler";
import { inject, injectable } from "inversify";
import { DB_TYPES } from "./inversify.types";
import DatabaseContext from "./interfaces/DatabaseContext";

@injectable()
export default class MessageBridge implements MessageDataHandler {
	private readonly db: DatabaseContext;

	constructor(@inject(DB_TYPES.AggreagtorDatabase) db: DatabaseContext) {
		this.db = db;
	}

	public async subscribeToMessages(onMessage: (message: SocketMessage) => void): Promise<void> {
		return this.db
			.connect(this.db.info.name)
			.then(async (connection) => {
				await r
					.db(this.db.info.name)
					.table(this.db.info.tableNames.message)
					.wait()
					.run(connection);
				return r
					.db(this.db.info.name)
					.table(this.db.info.tableNames.message)
					.changes()
					.run(connection);
			})
			.then((cursor) => {
				cursor.each((error, row) => {
					if (error) {
						console.error(error);
						return;
					}					
					const newValue = row["new_val"];
					if (newValue) {						
						const socketMessage = newValue as SocketMessage;
						console.log(`Recieved message from ${socketMessage.service?.friendlyName} @ ${Date.now().toString()}`);
						onMessage(socketMessage);
					}
				});
			})
			.catch((x) => {
				console.error("Error occured when listening to changes: " + x);
			});
	}

	async pushMessageToQueue(message: SocketMessage) {
		return this.db.connect(this.db.info.name).then((connection) => {
			return r
				.table(this.db.info.tableNames.message)
				.insert(message)
				.run(connection)
				.then((result) => {
					if (result.inserted === 0) {
						console.error("Failed to insert message into the database.")
					} 
				})
				.catch((error) => {
					console.error("An error occured whilst adding a message to the database." + error);
				})
				.finally(() => {
					this.db.close(connection);
				});
		});
	}

	async removeMessage(id: string): Promise<boolean> {
		return this.db.connect(this.db.info.name).then((connection) => {
			return r
				.table(this.db.info.tableNames.message)
				.get(id)
				.delete()
				.run(connection)
				.then((result) => result.deleted === 1)
				.catch((err) => {
					console.error(err);
					return false;
				})
				.finally(() => {
					this.db.close(connection);
				});
		});
	}
}
