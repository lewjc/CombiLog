import { MessageType } from "./enums/MessageType";
import { ErrorMessageCode } from "./enums/ErrorMessageCodes";
import { Service } from "../service/types";

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
