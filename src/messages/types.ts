import { Service } from "service";
import { ErrorMessageCode } from "./enums/error-message-codes";
import { MessageType } from "./enums/message-type";

export type SocketMessage = {
  id?: string;
  type: MessageType;
  content: string;
  service?: Service;
};

export interface ErrorMessage {
  message: string;
  errorCode: ErrorMessageCode;
}
