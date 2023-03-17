# loggle

## Easy-to-use and configurable logging library for the browser.

### Features

- useful (overrideable) defaults, no config required.
- < 2kb minified + gzipped. no external dependencies.
- `sink` options for easily sending log output to different destinations. specify a POST endpoint url or arbitrary JS function to receive the log output. 
- `aggregateTabs` option to combine log output from multiple tabs open to the same page.
- typical logging level options, with configurable message prefixes and colors
- include arbitrary metadata/tags with output
- share/extend configuration across multiple logger instances via `createSublogger`

### Installation

In your project directory:

```
  npm i @leothorp/loggle
```

### Usage Example

#### Code

```js
import { createLogger } from "@leothorp/loggle";

//configure logging for different environments at build time
const log = createLogger({ level: process.env.LOG_LEVEL });

log.error("error");
log.warn("warning");
log.info("some info", "more content");

//override parent/default config property
log.debug(
  { prefix: { format: (parts: string[]) => `<${parts.join("__")}>:` } },
  "a debug message"
);

// send log output to an HTTP endpoint, along with additional metadata
// (configurable globally or per-log)
log.critical(
  {
    sink: { endpoint: "https://httpbin.org/post" },
    metadata: { tags: ["bad-errors"], userAgent: navigator.userAgent },
  },
  "This browser doesn't work"
);
```

#### Console Output

<img width="459" alt="image" src="https://user-images.githubusercontent.com/12928449/177245621-df054cbc-4bf1-4d24-89f8-f7c2f14be005.png">

### Configuration

`createLogger` accepts a single optional configuration object as a parameter. This object can contain various config properties; default values and explanations for each property
are below (taken from src/index.js). [Cleaner docs for those are work-in-progress.]

It's only necessary to include the properties you want to change- any properties left undefined on the configuration object will take their default value automatically.

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
  formatLogSegments: (elements) => elements.join(" "),

  //settings related to the prefix for each message.
  //pass 'prefix: false' to remove the prefix entirely
  prefix: {
    includeLevelName: true,
    includeTime: true,
    getCurrentTimeString: () =>
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
      }),

    //format string output for prefix,
    //also can add arbitrary material here
    format: (segments) => `[${segments.join(" ")}]`,

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

  //settings for where the logger should send the log output.
  sink: {
    //string URL of an endpoint the logger will POST logs to, if present.
    endpoint: null,

    //function to pass each log to. 'sink: {func: false}' to disable.
    func: ({ message: { asSegments, asString }, metadata }) => {
      console.log(...asSegments);
    },

    // if true, when multiple tabs are open to your page, each tab will log the aggregated log output from all other tabs. Useful for debugging a sequence of events spanning multiple tabs.
    aggregateTabs: false
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
  filter: ({ message: { asSegments, asString }, metadata }) => true,

  //if true, wrap log calls in a 0ms setTimeout() to avoid blocking event loop
  async: false
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

const parentLog = createLogger({
  prefix: {
    format: (parts: string[]) => `<${parts.join("|")}$$>`,
    getCurrentTimeString: () => new Date(),
  },
});

const subLog = parentLog.createSubLogger({
  prefix: {
    includeLevelName: false,
    getCurrentTimeString: Date.now,
  },
});

subLog.critical("sublog output");

// The above has the same result as if there were a single parent config of
// {
//   prefix: {
//     format: (parts: string[]) => `<${parts.join("|")}$$>`
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
