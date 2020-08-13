import { ServiceSocket } from "./serviceSocket";

class SockerRegister {
	openSockets: Array<ServiceSocket>;

	constructor() {
		this.openSockets = [];
	}

	/**
	 * Loads a service into the current open socket
	 * @param socketID The ID of the service
	 */
	loadServiceSocket(socketID: string) {
		// Find the service information from the database, open a websocket and store in the  open sockets.
	}

	/**
	 * Registers a service to the aggregator
	 * @param url The url of the service.
	 */
	registerServiceSocket(url: string) {}

	/**
	 *
	 * @param socketID
	 */
	closeServiceSocket(socketID: string) {}
}
