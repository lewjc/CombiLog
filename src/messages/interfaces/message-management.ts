import { ConsumerSocket } from "socket";
import { SocketMessage } from "../types";

export interface MessageManagement {
  initialiseConsumerMessageSubscription(
    consumerConnections: Array<ConsumerSocket>
  ): Promise<void>;
  pushMessageToQueue(message: SocketMessage): Promise<void>;
  deleteMessage(id: string): Promise<boolean>;
}
