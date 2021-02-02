import { Service } from "../service/types";
import WebSocket from "ws";

/**
 * @type ServiceSocket
 * @property id: The id of the service socket
 * @property url: The url of the Service
 */
export type ConsumerSocket = {
  id: string;
  socket: WebSocket;
};

/*
 * @type ServiceSocket
 * @property id: The id of the service socket
 * @property url: The url of the Service
 */
export type ServiceSocket = {
  id: string;
  service: Service;
  socket: WebSocket;
};

export type Ping = {
  ping: string;
};

function isPing(type: any): type is Ping {
  const potentialType = type as Ping;
  return potentialType.ping === "pong";
}
