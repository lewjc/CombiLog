export class SocketError extends Error {
  public static SOCKET_NOT_FOUND = (serviceName: string): string =>
    `Could not find socket for: ${serviceName}`;

  constructor(public message: string) {
    super(message);
    this.name = SocketError.name;
    this.stack = new Error().stack;
  }
}
