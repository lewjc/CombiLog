import "reflect-metadata";
import { inject, injectable } from "inversify";
import { ConsumerSocket } from "socket";
import { MessageManagement } from "./interfaces/message-management";
import { SocketMessage } from "./types";
import { DB_TYPES, MessageDataHandler } from "db";

@injectable()
export class MessageManager implements MessageManagement {
  private readonly messageBridge: MessageDataHandler;

  public constructor(
    @inject(DB_TYPES.MessageBridge) messageBridge: MessageDataHandler
  ) {
    this.messageBridge = messageBridge;
  }

  public async deleteMessage(id: string): Promise<boolean> {
    return this.messageBridge.removeMessage(id);
  }

  public async initialiseConsumerMessageSubscription(
    consumerConnections: Array<ConsumerSocket>
  ): Promise<void> {
    return this.messageBridge.subscribeToMessages((message) => {
      for (const consumerSocket of consumerConnections) {
        if (message) {
          consumerSocket.socket.send(JSON.stringify(message));
        }
      }
    });
  }

  public async pushMessageToQueue(message: SocketMessage): Promise<void> {
    return this.messageBridge.pushMessageToQueue(message);
  }
}
