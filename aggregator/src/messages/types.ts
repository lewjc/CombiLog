import { MessageType } from "./enums/MessageType";
import { ErrorMessageCode } from "./enums/ErrorMessageCodes";

export type SocketMessage = {
	type: MessageType;
	content: string;
};

export interface ErrorMessage {
	message: string;
	errorCode: ErrorMessageCode;
}
