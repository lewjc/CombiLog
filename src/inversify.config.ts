import "reflect-metadata";
import { Container } from "inversify";
import { SERVICE_TYPES } from "./service/inversify.types";
import { DB_TYPES } from "./db/inversify.types";
import { MESSAGE_TYPES } from "./messages/inversify.types";
import { SOCKET_TYPES } from "./socket/inversify.types";
import { SETTINGS_TYPES } from "./settings/inversify.types";

import ServiceManagement from "./service/interfaces/ServiceManagement";
import AggregatorDatabase from "./db/AggregatorDatabase";
import DatabaseContext from "./db/interfaces/DatabaseContext";
import MessageDataHandler from "./db/interfaces/MessageDataHandler";
import MessageBridge from "./db/MessageBridge";
import ServiceDataHandler from "./db/interfaces/ServiceDataHandler";
import ServiceBridge from "./db/ServiceBridge";
import MessageManager from "./messages/MessageManager";
import MessageManagement from "./messages/interfaces/MessageManagement";
import SocketHub from "./socket/interfaces/SocketHub";
import SocketManager from "./socket/SocketManager";
import ServiceManager from "./service/ServiceManager";
import SettingsDataHandler from "./db/interfaces/SettingsDataHandler";
import SettingsBridge from "./db/SettingsBridge";
import SettingsManagement from "./settings/interfaces/SettingsManagement";
import SettingsManager from "./settings/SettingsManager";

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
