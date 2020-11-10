import "reflect-metadata";
import { ConsumerSocket } from "../socket/types";
import { SocketMessage } from "./types";
import MessageManagement from "./interfaces/MessageManagement";
import { inject, injectable } from "inversify";
import { DB_TYPES } from "../db/inversify.types";
import MessageDataHandler from "../db/interfaces/MessageDataHandler";

@injectable()
export default class MessageManager implements MessageManagement {
  private readonly messageBridge: MessageDataHandler;

  constructor(
    @inject(DB_TYPES.MessageBridge) messageBridge: MessageDataHandler
  ) {
    this.messageBridge = messageBridge;
  }
  async deleteMessage(id: string): Promise<boolean> {
    return this.messageBridge.removeMessage(id);
  }

  async initialiseConsumerMessageSubscription(
    consumerConnections: Array<ConsumerSocket>
  ): Promise<void> {
    return this.messageBridge.subscribeToMessages((message) => {
      consumerConnections.forEach((consumerSocket) => {
        if (message) {
          consumerSocket.socket.send(JSON.stringify(message));
        }
      });
    });
  }

  async pushMessageToQueue(message: SocketMessage): Promise<void> {
    console.info(
      `Pushing message to queue from ${
        message.service?.friendlyName
      } @ ${Date.now().toString()}`
    );
    return this.messageBridge.pushMessageToQueue(message);
  }
}
