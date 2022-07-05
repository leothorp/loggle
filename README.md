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

```javascript
import { createLogger } from "@leothorp/loggle";


const log = createLogger({ level: 'debug' });
log.critical("critical");
log.error("error");
log.warn("warning");
log.info("some info", "more content");

//override config to add a different prefix format on this call
log.debug(
  { prefix: { format: (parts: string[]) => `((${parts.join("__")})):` } },
  "a debug message"
);
```

### Configuration

`createLogger` accepts a single optional configuration object as a parameter. This object can contain various config parameters. Default values and explanations for each property can be found in the defaultConfig object in src/index.js [TODO: docs in README on each property to come.]

It's only necessary to include the properties you want to change- any properties left undefined on the configuration object (or its sub-objects) will take their default/parent value automatically.

#### `metadata`
The `metadata` key is either an object, or a function which returns an object, containing arbitrary key/value pairs that you want sent to your sink endpoint/function for each log message (by default, none are included.) It could be an app id,
a reference to the environment, debugging context, etc. It's also a way to pass tags/categories for filtering and grouping
messages.


### Extending Log Configuration

Each individual log call (e.g., `log.info()`) can also optionally be
passed these config options. These will be merged with the values from the parent createLogger, with values from the individual log call taking precedence in the case of them both specifying a particular key.

```javascript
log.debug(
  { prefix: { format: (parts: string[]) => `((${parts.join("__")})):` } },
  "a debug message"
);
```

Config/metadata can also be extended with the `createSubLogger` function, as shown in the example below.

````javascript
import { createLogger } from "@leothorp/loggle";


const log = createLogger({
  prefix: { includeLevelName: false, getCurrentTimeString: () => new Date() },
});

const subLog = log.createSubLogger({
  prefix: {  getCurrentTimeString: Date.now },
});

subLog.info("sublog output");

// The above has the same result as if there were a single parent config of
// {
//   prefix: {
//     includeLevelName: false,
//     getCurrentTimeString: Date.now,
//   },
// };

```

To summarize, the overall precedence order for any specified config/metadata is:
1. individual log function call
2. parent createSubLogger
3. parent createLogger
4. library defaults