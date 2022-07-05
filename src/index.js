import { post } from "./request.js";

const mapObj = (obj, fn) => {
  const mappedAsArr = Object.entries(obj).map(([k, v]) => fn(k, v));
  return Object.fromEntries(mappedAsArr);
};
const invokeIfFunction = (val) => (typeof val === "function" ? val() : val);

const DEFAULT_LOG_LEVEL = "info";

const LOG_LEVELS = {
  critical: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

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
    getRestOfPrefix: () => [],
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

  //settings for where the logger should send the log output
  sink: {
    //string URL of an endpoint the logger will POST logs to, if present.
    endpoint: null,

    //function to pass each log to. 'sink: {func: false}' to disable.
    func: ({ message: { asSegments, asString }, metadata }) => {
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
  filter: ({ message: { asSegments, asString }, metadata }) => true,
};

const toObj = (arr, subObjSelector) =>
  arr.reduce((acc, curr) => {
    const objToAdd = subObjSelector(curr);
    return { ...acc, ...objToAdd };
  }, {});

const isPlainObj = (val) =>
  !Array.isArray(val) && typeof val === "object" && val !== null;
const flattenObjHash = (obj) => {
  return toObj(Object.keys(obj), (k) => {
    if (isPlainObj(obj[k])) {
      return {
        [k]: true,
        ...flattenObjHash(obj[k]),
      };
    }
    return { [k]: true };
  });
};
const flattenedConfigKeysHash = flattenObjHash(defaultConfig);
const isPlainConfigObj = (val) => {
  return (
    isPlainObj(val) &&
    Object.keys(val).every((k) => flattenedConfigKeysHash.hasOwnProperty(k))
  );
};
const mergeConfigs = (defaultConfigVal, inputConfigVal) => {
  if (inputConfigVal.replaceParentConfig) {
    return inputConfigVal;
  }
  if (inputConfigVal.replaceParentMetadata) {
    return mergeConfigs(
      { ...defaultConfigVal, metadata: null },
      inputConfigVal
    );
  }
  const final = mapObj(defaultConfigVal, (k, v) => {
    if (
      isPlainConfigObj(defaultConfigVal[k]) &&
      isPlainConfigObj(inputConfigVal[k])
    ) {
      return [k, mergeConfigs(defaultConfigVal[k], inputConfigVal[k])];
    }
    return [k, inputConfigVal.hasOwnProperty(k) ? inputConfigVal[k] : v];
  });
  return final;
};

const getPrefixSegments = (levelName, config, includeColor) => {
  if (!config.prefix) {
    return [];
  }
  const prefixElements = [
    config.prefix.includeLevelName && levelName,
    config.prefix.includeTime && config.prefix.getCurrentTimeString(),
    ...config.prefix.getRestOfPrefix(),
  ];

  const formatChar = includeColor ? "%c" : "";
  const prefixStr = formatChar + config.prefix.format(prefixElements);
  const css = includeColor ? `color: ${config.prefix.colors[levelName]};` : "";
  const prefixSegments = css ? [prefixStr, css] : [prefixStr];
  return prefixSegments;
};

/**
 * returns an object with functions for each log level.
 * const log = createLogger();
 *
 * log.info('msg part 1', 'part 2')
 *
 */

const normalizeLevel = (levelConfigVal) => {
  if (typeof levelConfigVal === "number") {
    return levelConfigVal;
  }

  return LOG_LEVELS[levelConfigVal];
};

const assembleSegments = (logArgs, levelName, config, includeColor) => {
  return [
    ...getPrefixSegments(levelName, config, includeColor),
    ...logArgs,
  ].filter((x) => x);
};

const createLogger = (rawInputConfig = defaultConfig) => {
  const globalConfig = mergeConfigs(defaultConfig, rawInputConfig);
  const makeLevelLogger = (levelName, intVal) => {
    return (...baseLogArgs) => {
      //TODO(lt): vvv how differentiate another obj they want to send with same keys?
      //localOverrideKeys is for that.

      const hasAdditionalConfig = isPlainConfigObj(baseLogArgs[0]);

      const config = hasAdditionalConfig
        ? mergeConfigs(globalConfig, baseLogArgs[0])
        : globalConfig;

      const logArgs = hasAdditionalConfig ? baseLogArgs.slice(1) : baseLogArgs;

      if (!config.enabled || intVal > normalizeLevel(config.level)) {
        return;
      }
      const metadata = invokeIfFunction(config.metadata);

      const allLogSegments = assembleSegments(
        logArgs,
        levelName,
        config,
        !!config.prefix.colors
      );

      const asString = config.formatLogSegments(allLogSegments);

      if (
        !config.filter({
          message: {
            asString,
            asSegments: allLogSegments,
          },
          metadata,
        })
      ) {
        return;
      }

      if (config.sink.func) {
        config.sink.func({
          message: {
            asString,
            asSegments: allLogSegments,
          },
          metadata,
        });
      }

      if (config.sink.endpoint) {
        //TODO: add batch option for sending sink endpoint requests

        //remove color string formatting/prefix segment
        const segmentsForEndpoint = assembleSegments(
          logArgs,
          levelName,
          config,
          false
        );

        post(config.sink.endpoint, {
          message: {
            asString: config.formatLogSegments(segmentsForEndpoint),
            asSegments: segmentsForEndpoint,
          },
          metadata,
        });
      }
    };
  };

  const levelLoggers = mapObj(LOG_LEVELS, (name, intValue) => {
    return [name, makeLevelLogger(name, intValue)];
  });

  return {
    ...levelLoggers,
    createSubLogger: (subConfig) => {
      return createLogger(...mergeConfigs(globalConfig, subConfig));
    },
  };
};

export { createLogger, LOG_LEVELS };
