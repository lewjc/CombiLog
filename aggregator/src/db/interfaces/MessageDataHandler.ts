import { SocketMessage } from "../../messages/types";

export default interface MessageDataHandler {
	subscribeToMessages(onMessage: (message: SocketMessage) => void): Promise<void>;

	pushMessageToQueue(message: SocketMessage): Promise<void>;
}
