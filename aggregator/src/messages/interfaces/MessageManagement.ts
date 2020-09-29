import { ConsumerSocket } from "../../socket/types";
import { SocketMessage } from "../types";

export default interface MessageManagement {
	initialiseConsumerMessageSubscription(consumerConnections: Array<ConsumerSocket>): Promise<void>;
	pushMessageToQueue(message: SocketMessage): Promise<void>;
}
