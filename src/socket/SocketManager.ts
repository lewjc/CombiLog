import "reflect-metadata";
import { ConsumerSocket, ServiceSocket } from "./types";
import WebSocket, { Server, Data } from "ws";
import { IncomingMessage, STATUS_CODES } from "http";
import { v4 as uuid } from "uuid";
import { ClosureCodes } from "./enums/closureCodes";
import url from "url";
import { SocketMessage } from "../messages/types";
import tls from "tls";
import { MessageType } from "../messages/enums/MessageType";
import { ErrorMessage } from "../messages/ErrorMessage";
import { ErrorMessageCode } from "../messages/enums/ErrorMessageCodes";
import SocketHub from "./interfaces/SocketHub";
import { inject, injectable } from "inversify";
import { SERVICE_TYPES } from "../service/inversify.types";
import { MESSAGE_TYPES } from "../messages/inversify.types";
import ServiceManagement from "../service/interfaces/ServiceManagement";
import MessageManagement from "../messages/interfaces/MessageManagement";
import { Service } from "../service/types";

@injectable()
class SocketManager implements SocketHub {
  private serviceManager: ServiceManagement;
  private messageManager: MessageManagement;

  readonly server: Server;
  private readonly port: number;
  private readonly serviceConnections: Array<ServiceSocket> = [];
  private readonly consumerConnections: Array<ConsumerSocket> = [];
  private readonly servicesConnecting: Array<String> = [];
  private readonly changeFeed: Promise<void>;

  constructor(
    @inject(SERVICE_TYPES.ServiceManager) serviceManager: ServiceManagement,
    @inject(MESSAGE_TYPES.MessageManager) messageManager: MessageManagement
  ) {
    this.serviceManager = serviceManager;
    this.messageManager = messageManager;
    console.info("Socket Manager Status: Setting Up...");
    if (process.env.SOCKET_SERVER_PORT) {
      this.port = parseInt(process.env.SOCKET_SERVER_PORT);
    } else {
      this.port = 13337;
    }
    this.server = new WebSocket.Server({
      port: this.port,
    });
    console.info(`Socket Manager Listening on Port: ${this.port}`);

    this.initialiseAggregatorServerEvents();
    this.initialisePing();
    this.changeFeed = this.messageManager.initialiseConsumerMessageSubscription(
      this.consumerConnections
    );
    this.changeFeed.catch((err) => {
      console.error(err);
    });

    console.info("Socket Register Status: Ready!");
  }

  private initialiseAggregatorServerEvents() {
    this.server.on(
      "connection",
      (socket: WebSocket, request: IncomingMessage) => {
        let builtUrl: string =
          request.socket instanceof tls.TLSSocket
            ? "https"
            : "http" + "://" + (request.headers.host ?? "") + request.url;

        if (builtUrl) {
          let incomingUrl = url.parse(builtUrl, true);
          const connectionType: string | Array<string> | undefined =
            incomingUrl.query["connectionType"];
          if (!connectionType || connectionType instanceof Array) {
            console.error(
              `Invalid connection type query parameter passed ${connectionType}`
            );
            socket.close(ClosureCodes.INVALID_CONNECTION_QUERY_PARAM);
          } else if (connectionType === "service") {
            let secret = request.headers["combilog-service-secret"] ?? "";

            if (!secret || secret instanceof Array) {
              console.error(
                `Invalid secret header provided for service connection.`
              );
              socket.close(ClosureCodes.INVALID_SECRET);
            } else if (
              this.serviceConnections.filter((x) => x.service.secret === secret)
                .length > 0 ||
              this.servicesConnecting.includes(secret)
            ) {
              console.error(`Secret already in use.`);
              socket.close(ClosureCodes.SECRET_IN_USE);
              socket.terminate();
            } else {
              if (!this.servicesConnecting.includes(secret)) {
                this.servicesConnecting.push(secret);
                this.handleServiceConnection(socket, secret);
              }
            }
          } else if (connectionType === "consumer") {
            this.handleConsumerConnection(socket);
          } else {
            // A request should always have a url attached, if this gets here, close and ask to retry later
            console.error("No URL found in connection request object.");
            socket.close(ClosureCodes.TRY_AGAIN_LATER);
          }
        }
      }
    );
  }

  private initialisePing() {
    const ping = {
      ping: "pong",
    };

    setInterval(() => {
      this.consumerConnections.forEach((connection) => {
        connection.socket.ping(JSON.stringify(ping));
      });

      console.log(`PING: ${this.consumerConnections.length} Consumers`);

      this.serviceConnections.forEach((connection) => {
        connection.socket.ping(JSON.stringify(ping));
      });

      console.log(`PING ${this.serviceConnections.length} Services`);

      const keepaliveSignal: SocketMessage = {
        type: MessageType.KEEPALIVE,
        content: "KEEPALIVE",
      };

      this.messageManager.pushMessageToQueue(keepaliveSignal);
    }, 55000);
  }

  private handleServiceConnection(socket: WebSocket, secret: string): void {
    this.serviceManager.findServiceBySecret(secret).then((service) => {
      if (service) {
        const sessionID = uuid();
        let serviceSocket: ServiceSocket = {
          id: sessionID,
          service: service,
          socket: socket,
        };

        serviceSocket.socket.send("OK");
        this.serviceConnections.push(serviceSocket);
        this.serviceManager.setServiceStatus(service.id, true);
        this.servicesConnecting.splice(
          this.servicesConnecting.indexOf(secret),
          1
        );
        console.log(`Accepted connection for service ${service.friendlyName}`);
        serviceSocket.socket.on("message", async (data: Data) => {
          await this.serviceSocketOnMessage(socket, data, service);
        });

        const closeConnection = () => {
          const index = this.serviceConnections
            .map(function (e) {
              return e.service.secret;
            })
            .indexOf(secret);
          this.serviceConnections.splice(index, 1);
        };

        serviceSocket.socket.on("error", async (err) => {
          closeConnection();
          console.error(
            `Closing connection for ${service.friendlyName}. Error: ${err}`
          );
          await this.serviceManager.setServiceStatus(service.id, false);
        });

        serviceSocket.socket.on("close", async (code, reason) => {
          closeConnection();
          console.info(
            `Closing connection for ${service.friendlyName}. Code: ${code} - Reason: ${reason}`
          );
          await this.serviceManager.setServiceStatus(service.id, false);
        });
      } else {
        console.error(`No service found for secret: ${secret}`);
        this.servicesConnecting.splice(
          this.servicesConnecting.indexOf(secret),
          1
        );
        socket.close(ClosureCodes.UNREGISTERED_SERVICE);
      }
    });
  }

  private handleConsumerConnection(socket: WebSocket): void {
    const sessionID = uuid();
    let consumerSocket: ConsumerSocket = {
      id: sessionID,
      socket: socket,
    };
    console.log("Registered Consumer");

    const closeConnection = () => {
      const index = this.consumerConnections
        .map(function (e) {
          return e.id;
        })
        .indexOf(sessionID);
      this.consumerConnections.splice(index, 1);
    };

    socket.on("error", async (err) => {
      closeConnection();
      console.log(`Error with consumer connection: ${err}`);
    });

    socket.on("close", async (code, reason) => {
      closeConnection();
      console.info(
        `Closing connection for Consumer. Code: ${code} - Reason: ${reason}`
      );
    });

    this.consumerConnections.push(consumerSocket);
  }

  private async serviceSocketOnMessage(
    socket: WebSocket,
    data: Data,
    service: Service
  ) {
    // Now we have recieved a message from one of our services, we need to see if there are any consumer connections and broadcast to all of them.
    // Following that, we need to push messages to the archiving queue which then stores these in a designated data area. (redis for storing archived logs)
    try {
      const message: SocketMessage = JSON.parse(
        data.toString()
      ) as SocketMessage;
      message.service = { ...service };
      // Blank out the secret
      message.service.secret = "******";
      message.service.id = "******";
      if (message != null) {
        switch (message.type) {
          case MessageType.LOG: {
            if (message.content.includes(""))
              message.content = `[${message.service.friendlyName}] ${message.content}`;
            await this.messageManager.pushMessageToQueue(message);
          }

          default: {
            // If the message type does not exist,
            const errorMessageType = ErrorMessageCode.INVALID_MESSAGE_TYPE;
            const errorMessage: ErrorMessage = {
              message: ErrorMessageCode[errorMessageType],
              errorCode: errorMessageType,
            };

            socket.send(errorMessage);
          }
        }
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error(
          "Data recieved from service socket was not in a parseable format."
        );
      }
    }
  }
}

export default SocketManager;
