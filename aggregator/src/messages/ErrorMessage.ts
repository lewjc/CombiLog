import { ErrorMessageCode } from "./enums/ErrorMessageCodes";

export interface ErrorMessage {
	message: string;
	errorCode: ErrorMessageCode;
}
