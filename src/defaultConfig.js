import { flattenObjHash, isPlainObj } from "./utils";

const DEFAULT_LOG_LEVEL = "info";

export const LOG_LEVELS = {
  critical: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export const defaultConfig = {
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
    //format string output, also can add arbitrary material to prefix here
    format: (segments) => `[${segments.join(" ")}]`,

    //css color names or hex values per-level.
    //can just pass one or two and keep defaults for rest.
    //pass 'colors: false' to disable colored prefixes
    colors: {
      critical: "red",
      error: "orange",
      warn: "yellow",
      info: "skyblue",
      debug: "lightgreen",
    },
  },

  //settings for where the logger should send the log output
  sink: {
    //string URL of an endpoint the logger will POST logs to, if present.
    endpoint: null,

    //function to pass each log to. 'sink: {func: false}' to disable.
    func: ({ message: { asSegments, asString }, metadata }) => {
      console.log(...asSegments);
    },
    // if true, when multiple tabs are open to your page, each tab will log the aggregated log output from all other tabs. Useful for debugging a sequence of events spanning multiple tabs.
    aggregateTabs: false,
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
};

export const isPlainConfigObj = (() => {
  // avoid exposing to outer scope
  const flattenedConfigKeysHash = flattenObjHash(defaultConfig);
  return (val) => {
    return (
      isPlainObj(val) &&
      Object.keys(val).every((k) => flattenedConfigKeysHash.hasOwnProperty(k))
    );
  };
})();
