# loggle

## An easy-to-use, flexible, and tiny logging library for the browser.

### Features

- no config required, useful (but overrideable) defaults
- `sink` options - pass an endpoint URL (or a JS function) to send logs to
- standard set of log levels, with configurable message prefixes and colors
- include arbitrary metadata/tags with logs
- centralized filtering via function (particularly helpful for debug messages in local dev)

### Installation

```
  npm i @leothorp/loggle
```

### Usage Example

```
//TODO(lt): vvv double check this import works
import {createLogger} from "loggle";

export const log = createLogger({});

log.critical("critical")
log.error("error")
log.warn("warning")
log.info("some info")
log.debug("a debug message")
```

### Configuration

`createLogger` accepts a single optional parameter, a configuration object.
Each individual

Explanations of these properties and their default values are shown below.

//TODO(lt): vvv script to generate docs from this, or see what else
//like that already exists

{
//globally enable/disable logging
enabled: true,

//
level: DEFAULT_LOG_LEVEL, //suggest setting this via environment variable
prefix: {
//pass false to disable
includeLevelName: true,
includeTime: true,
getCurrentTimeString: () =>
new Date().toLocaleTimeString("en-US", { hour12: false }),
getRestOfPrefix: () => [],
formatLogSegments: (...elements) => elements.join(" "), //formatter for each comma separated argument passed to the logging func (prefix is included as first param)
colors: {
//css color names or hex values. can just pass one or two and keep defaults for rest. pass false to disable
critical: "red",
error: "orange",
warn: "yellow",
info: "skyblue",
debug: "green",
},
},
sink: {
endpoint: null, //string URL of an endpoint the logger will POST logs to, if present.
func: ({ message, metaProperties }) => console.log(message, metaProperties), //function to pass each log to.
},
metadata: {
properties: {}, //obj, or function that returns an obj, of arbitrary additional key/value pairs to include
includeInMessageString: false, //whether to tack metadata.properties onto end of message string logged, or only include as additional param to sink endpoints/functions
},

//TODO(lt): filter via regex

filter: ({ message, meta }) => true, //function for filtering logs based on message content/metadata

//TODO: batch option for sending
};
