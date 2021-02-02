# CombiLog

[![lewjc](https://circleci.com/gh/lewjc/CombiLog.svg?style=shield&circle-token=11b7967608848962be7f93ca96e24924c1c1663a)](https://app.circleci.com/pipelines/github/lewjc/CombiLog)

CombiLog is a logging aggregation tool that can act as a central hub for all of your logs! It combines your logs to save you digging across Containers and Virtual Machines.

It consists of 4 Components:

- Aggregator
- Dashboard
- Archiver
- RethinkDB

## Aggregator

The aggregator, found in this repository, is the main hub for communication between services and CombiLog. It handles reception of messages from services, storing them in Rethink and sending messages when Rethink publishes an event saying a new message is ready for processing (Pub/Sub, allows for aggregator load-balancing, which is in the backlog)

## Dashboard

The dashboard, found [here](https://github.com/lewjc/CombiLog-Dashboard), is where you can interact with the logs stored in CombiLog. This could be viewing realtime logs as they come in, viewing archived logs and also managing your services.

## Archiver

The archiver, found [here](https://github.com/lewjc/CombiLog-Archiver), deals with storing logs so they can be retrieved at a later date.

## RethinkDB

Database used by the aggregator for storing log messages + pub/sub functionality.

---

## Environment Variables

```
// Hostname of rethinkdb e.g. rethinkdb as the name of the docker service on the bridge network.
RETHINK_HOST=rethinkdb

// The port the websocket server will listen on.
SOCKET_SERVER_PORT=13337

// Username of rethinkdb
RETHINK_USER=admin

// Password for rethinkdb
RETHINK_PASSWORD=

// Communication port for rethindb (default 28015)
RETHINK_PORT=28015

// The port that the combilog express server will listen on.
COMBILOG_PORT=3000
```

## Handlers

Handlers are packages you can install that make integrating with CombiLog easier for you. The current list of handlers available are listed below.

- [Python handler](https://github.com/lewjc/CombiLog-PythonHandler)

## For Development

```
$ git clone https://github.com/lewjc/CombiLog.git combilog-aggregator

$ cd combilog-aggregator && npm start

```

## Sending Log Messages

In order to connect a service to the aggregator and begin sending log messages, you must do the following.

1. Register a new service in the dashboard, and retrieve the secret.
2. **IF USING A HANDLER**: Follow the instrucitons in the handler README and provide your secret as required.
3. **IF NOT USING A HANDLER**: See next steps.
4. Retrive the URL of the aggregator websocket.
5. Connect to the websocket server using the url and appending the following to the url:

```
// Example url
const url = 'https://combilog.service.net:13337'
const query = '?connectionType=service'

// Use this url to connect to the websocket server in your chosen language.
const fullURL = $`{url}{query}`

// Add a header to the socket open request with the following contents

const headers = { "combilog-service-secret": "MY-SUPER-SECRET"}

```

6. To send a Log Message to the aggregator, use your connection to the websocket server to send a message, using the following JSON payload

```
const myLogMessage = "This is a log message, Hello World.

// Send this over the websocket connection
const combilogMessage = {
  "type": 0,
  "message": myLogMessage
}

```

7. View your messages in the Realtime Log Viewer.
