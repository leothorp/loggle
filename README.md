# loggle

## An easy-to-use, flexible, and tiny logging library for the browser.

### Features

- no config required, useful (but overrideable) defaults
- `sink` options - specify a POST endpoint url (and/or a JS function) to receive the log output
- typical logging level options, with configurable message prefixes and colors
- include arbitrary metadata/tags with logs
- extend configuration via createSublogger
- ~1kb minified + gzipped, no external dependencies

### Installation

In your project directory:

```
  npm i @leothorp/loggle
```

### Usage Example

```js

import { createLogger } from "@leothorp/loggle";

const log = createLogger({ level: "debug" });
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

### Output

<img width="646" alt="image" src="https://user-images.githubusercontent.com/12928449/177232719-5e97e1b8-85cb-4b48-b10a-16080b3a00e1.png">

### Configuration

`createLogger` accepts a single optional configuration object as a parameter. This object can contain various config properties; default values and explanations for each property
are below (taken from src/index.js). [Cleaner docs for those are work-in-progress.]

It's only necessary to include the properties you want to change- any properties left undefined on the configuration object (or its sub-objects) will take their default/parent value automatically.

#### Default Configuration Values

```js

const defaultConfig = {
  //globally enable/disable logging
  enabled: true,

  //current level for this logger, as int or string name value- 
  //logs belonging to levels higher than this will be silenced
  //(see LOG_LEVELS above for possible values)
  level: DEFAULT_LOG_LEVEL,

  //formatter for the comma separated arguments, 
  //should return the final message string
  //(prefix is included as first param)
  formatLogSegments: (elements) =>
    elements.join(" "),

  //settings related to the prefix for each message. 
  //pass 'prefix: false' to remove the prefix entirely
  prefix: {
    includeLevelName: true,
    includeTime: true,
    getCurrentTimeString: () =>
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
      }),
    getRestOfPrefix: () => [],
    format: (segments) =>
      `[${segments.join(" ")}]`,

    //css color names or hex values per-level.
    //can just pass one or two and keep defaults for rest.
    //pass 'colors: false' to disable colored prefixes
    colors: {
      critical: "red",
      error: "orange",
      warn: "yellow",
      info: "skyblue",
      debug: "green",
    },
  },

  //settings for where the logger should send the log output
  sink: {
    //string URL of an endpoint the logger will POST logs to, if present.
    endpoint: null,

    //function to pass each log to. 'sink: {func: false}' to disable.
    func: ({
      message: { asSegments, asString },
      metadata,
    }) => {
      console.log(...asSegments);
    },
  },

  // The `metadata` property is either an object, or a function which returns an object,
  // containing arbitrary key/ value pairs that you want sent to your sink endpoint/function
  // for each log message(by default , `clientTimestamp` is included.)
  // references to the environment/running application, debugging context, 
  // log categories/ tags, etc.
  // Can be useful in conjunction with `filter`.
  metadata: () => ({
    clientTimestamp: Date.now(),
  }),

  //disable the "merging" behavior for all config properties;
  //replace the parent config completely
  replaceParentConfig: false,

  //disable the "merging" behavior for metadata properties
  replaceParentMetadata: false,

  //function for filtering logs based on message content/metadata
  filter: ({
    message: { asSegments, asString },
    metadata,
  }) => true,
};

```

### Extending Log Configuration

Each individual log call (e.g., `log.info()`) can also optionally be
passed these config options. These will be merged with the values from the parent createLogger, with values from the individual log call taking precedence in the case of them both specifying a particular key.

```js

log.debug(
  { prefix: { format: (parts: string[]) => `((${parts.join("__")})):` } },
  "a debug message"
);

```

Config/metadata can also be extended with the `createSubLogger` function, as shown in the example below.

```js

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

