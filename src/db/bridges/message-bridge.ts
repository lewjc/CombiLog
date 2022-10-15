import { inject, injectable } from "inversify";
import { r } from "rethinkdb-ts";
import { MessageType } from "messages/enums/message-type";
import { SocketMessage } from "messages/types";
import { MessageDataHandler, DatabaseContext } from "../interfaces";
import { DB_TYPES } from "../inversify.types";

@injectable()
export class MessageBridge implements MessageDataHandler {
  private readonly db: DatabaseContext;

  public constructor(@inject(DB_TYPES.AggreagtorDatabase) db: DatabaseContext) {
    this.db = db;
  }

  public async subscribeToMessages(
    onMessage: (message: SocketMessage) => void
  ): Promise<void> {
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
            console.error(
              `Error occured while listening for changes: ${error.message}`
            );
            return;
          }
          const newValue = row.new_val;
          if (newValue) {
            const socketMessage = newValue as SocketMessage;

            if (socketMessage.type !== MessageType.KEEPALIVE) {
              onMessage(socketMessage);
            }
          }
        });
      })
      .catch((error) => {
        console.error("Error occured when listening to changes: " + error);
      });
  }

  public async pushMessageToQueue(message: SocketMessage) {
    return this.db.connect(this.db.info.name).then((connection) => {
      return r
        .table(this.db.info.tableNames.message)
        .insert(message)
        .run(connection)
        .then((result) => {
          if (result.inserted === 0) {
            console.error("Failed to insert message into the database.");
          }
        })
        .catch((error) => {
          console.error(
            "An error occured whilst adding a message to the database." + error
          );
        })
        .finally(() => {
          this.db.close(connection);
        });
    });
  }

  public async removeMessage(id: string): Promise<boolean> {
    return this.db.connect(this.db.info.name).then((connection) => {
      return r
        .table(this.db.info.tableNames.message)
        .get(id)
        .delete()
        .run(connection)
        .then((result) => result.deleted === 1)
        .catch((error) => {
          console.error(error);
          return false;
        })
        .finally(() => {
          this.db.close(connection);
        });
    });
  }
}
