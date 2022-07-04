# loggle

## An easy-to-use, flexible, and tiny logging library for the browser.

### Features

- no config required, useful (but overrideable) defaults
- `sink` options - pass an endpoint URL (or a JS function) to send logs to
- standard set of log levels, with configurable message prefixes and colors
- include arbitrary metadata/tags with logs
- extend configuration via subloggers
- tiny, no external dependencies (~1kb minified + gzipped)

### Installation

In your project directory:

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
log.info("some info", "more content")
log.debug("a debug message")
```

### Configuration and Metadata

`createLogger` accepts a single optional parameter- an object which can contain
one or both of `config` and `metadata` as keys. These are described in more detail in their respective sections further down.

On both of these, it's only necessary to include the properties you want to change- any properties left undefined on the parent object (or its sub-objects) will take their default value automatically.

Each individual log call (e.g., `log.info()`) can also optionally be
passed these same `config` and `metadata` options (with the exception of one config option: `localOverrideKeys`). These will be merged with the config/metadata values from the parent createLogger, with values from the individual log call taking precedence in the case of them both specifying a particular key.

Config/metadata can also be extended with the `createSubLogger` function, as shown in the example below.

```
import {createLogger} from "loggle";

const log = createLogger({prefix: {formatLogSegments: segments => segments.join(" || "), getCurrentTimeString: () => new Date()}});

const subLog = log.createSubLogger({prefix: {includeLevelName: false, getCurrentTimeString: Date.now}})

/*he below will have the same result output as fir a single config containing
{
  prefix: {
    formatLogSegments: (segments) => segments.join(" || "),
    includeLevelName: false,
    getCurrentTimeString: Date.now,
  },
};
*/
subLog.info("some info");
```

To sum it up, the overall precedence order for any specified config/metadata is:

1. individual log function call
2. parent createSubLogger
3. parent createLogger
4. library defaults

#### `metadata`

`metadata` is an object of arbitrary key/value pairs that you want
included with every log message. It could be an app id,
a reference to the environment, debugging context, or anything you find useful. It will be sent to your sinks, and can also be included with
every logged message in the console with the config option `includeInMessageString`
(see `config` section below.)

Another common use case is to pass an array of tags for filtering/categorizing
messages.

#### `config`

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
