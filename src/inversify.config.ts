import "reflect-metadata";
import { Container } from "inversify";

import {
  AggregatorDatabase,
  DatabaseContext,
  DB_TYPES,
  MessageBridge,
  MessageDataHandler,
  ServiceBridge,
  ServiceDataHandler,
  SettingsBridge,
  SettingsDataHandler,
} from "./db";
import { MessageManagement, MessageManager, MESSAGE_TYPES } from "./messages";
import { ServiceManager, ServiceManagement, SERVICE_TYPES } from "./service";
import { SettingsManagement, SETTINGS_TYPES } from "./settings";
import SettingsManager from "./settings/SettingsManager";
import SocketHub from "./socket/interfaces/socket-hub";
import { SocketManager, SOCKET_TYPES } from "./socket";

const Resolver = new Container();

/** SCOPED */

// Management Layer

Resolver.bind<ServiceManagement>(SERVICE_TYPES.ServiceManager).to(
  ServiceManager
);
Resolver.bind<MessageManagement>(MESSAGE_TYPES.MessageManager).to(
  MessageManager
);
Resolver.bind<SettingsManagement>(SETTINGS_TYPES.SettingsManager).to(
  SettingsManager
);

// Bridge Layer

Resolver.bind<MessageDataHandler>(DB_TYPES.MessageBridge).to(MessageBridge);
Resolver.bind<ServiceDataHandler>(DB_TYPES.ServiceBridge).to(ServiceBridge);
Resolver.bind<SettingsDataHandler>(DB_TYPES.SettingsBridge).to(SettingsBridge);

Resolver.bind<DatabaseContext>(DB_TYPES.AggreagtorDatabase).to(
  AggregatorDatabase
);

/** SINGLETON */

Resolver.bind<SocketHub>(SOCKET_TYPES.SocketManager)
  .to(SocketManager)
  .inSingletonScope();

export { Resolver };
