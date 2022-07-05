# loggle

## An easy-to-use, flexible, and tiny logging library for the browser.

### Features

- no config required, useful (but overrideable) defaults
- `sink` options - pass an endpoint URL (or a JS function) to send logs to
- standard set of log levels, with configurable message prefixes and colors
- include arbitrary metadata/tags with logs
- extend configuration via subloggers
- ~1kb minified + gzipped, no external dependencies

### Installation

In your project directory:

```
  npm i @leothorp/loggle
```

### Usage Example

```
//TODO(lt): vvv double check this import works
import {createLogger} from "loggle";

const log = createLogger({ level: 4 });
log.critical("critical");
log.error("error");
log.warn("warning");
//override parent/default config property
log.info({
    prefix: { format: (parts: string[]) => `((${parts.join("__")})):` },
  },
  "some info",
  "more content"
);
log.debug("a debug message", "more");
```

### Configuration/Metadata

`createLogger` accepts a single optional configuration object as a parameter. This object can contain one or both of `config` and `metadata` as keys. These are described in more detail in their respective sections further down.

On both of these objects, it's only necessary to include the properties you want to change- any properties left undefined on the parent object (or its sub-objects) will take their default value automatically.


#### `metadata`

`metadata` is either an object, or a function which returns an object, containing arbitrary key/value pairs that you want
included with every log message (by default, none are included.) It could be an app id,
a reference to the environment, debugging context, or anything you find useful. It will be sent to your sinks, and can also be included with
every logged message in the console with the config option `includeInMessageString`
(see `config` section below.)

Another common use case is to pass tags/categories for filtering and grouping
messages.

#### `config`

Explanations of these properties and their default values are shown below.

[Docs are WIP at the moment. defaults can be viewed in the defaultConfig variable in src/index.js/]


### Extending Log Configuration

Each individual log call (e.g., `log.info()`) can also optionally be
passed these same `config` and `metadata` options (with the exception of one config option: `localOverrideKeys`). These will be merged with the config/metadata values from the parent createLogger, with values from the individual log call taking precedence in the case of them both specifying a particular key.

Config/metadata can also be extended with the `createSubLogger` function, as shown in the example below.

```
import {createLogger} from "loggle";

const log = createLogger({prefix: {formatLogSegments: segments => segments.join(" || "), getCurrentTimeString: () => new Date()}});

const subLog = log.createSubLogger({prefix: {includeLevelName: false, getCurrentTimeString: Date.now}})

/*
The below will have the same result output as if there were a single parent config containing
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