import { SocketMessage } from "messages";

export interface MessageDataHandler {
  subscribeToMessages(
    onMessage: (message: SocketMessage) => void
  ): Promise<void>;

  pushMessageToQueue(message: SocketMessage): Promise<void>;

  removeMessage(id: string): Promise<boolean>;
}
