import { post } from "./request.js";

const mapObj = (obj, fn) => {
  const mappedAsArr = Object.entries(obj).map(([k, v]) => fn(k, v));
  return Object.fromEntries(mappedAsArr);
};
const DEFAULT_LOG_LEVEL = 3; // higher values include all lower ones
const LOG_LEVELS = {
  critical: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};
const defaultConfig = {
  enabled: true,
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

const isPlainConfigObj = (val) => {
  return !Array.isArray(val) && typeof val === "object" && val !== null;
};
const mergeConfigs = (defaultConfigVal, inputConfigVal) => {
  const final = mapObj(defaultConfigVal, (k, v) => {
    if (
      isPlainConfigObj(defaultConfigVal[k]) &&
      isPlainConfigObj(inputConfigVal[k])
    ) {
      return [k, mergeConfigs(defaultConfigVal[k], inputConfigVal[k])];
    }

    return inputConfigVal.hasOwnProperty(k) ? inputConfigVal[k] : v;
  });
  return final;
};

const getPrefixSegments = (levelName, config) => {
  if (!config.prefix) {
    return null;
  }
  const prefixElements = [
    config.includeLevelName && levelName,
    config.includeTime && config.prefix.getCurrentTimeString(),
    ...getRestOfPrefix(),
  ];
  // const prefix = [`%c[${includeLevelName && name}`, config.prefix.getCurrentTimeString()]`].join(
  //   " "
  // );
  const prefixStr = formatPrefixString(prefixElements);
  const css = config.prefix.colors
    ? `color: ${config.prefix.colors[levelName]};`
    : "";
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

const createLogger = (inputConfig = defaultConfig) => {
  const globalConfig = mergeConfigs(defaultConfig, inputConfig);
  const makeLogger =
    (levelName, intVal) =>
    (...baseLogArgs) => {
      //TODO(lt): vvv how differentiate another obj they want to send?
      const hasAdditionalConfig = isPlainConfigObj(baseLogArgs[0]);
      const config = hasAdditionalConfig
        ? mergeConfigs(globalConfig, baseLogArgs[0])
        : globalConfig;
      const logArgs = hasAdditionalConfig ? baseLogArgs.slice(1) : baseLogArgs;

      if (!config.enabled || intVal > LOG_LEVEL) {
        return;
      }

      const meta =
        typeof config.metadata.properties === "function"
          ? config.metadata.properties()
          : config.metadata.properties;

      const allLogSegments = [
        ...getPrefixSegments(levelName, config),
        ...logArgs,
        config.metadata.includeInMessageString && meta,
      ].filter((x) => x);

      const message = formatLogSegments(...allLogSegments);
      if (!filter({ message, meta })) {
        return;
      }
      config.sink.func({ message, meta });
      if (config.sink.endpoint) {
        post(config.sink.endpoint, { message, meta });
      }
    };
  return mapObj(levels, (name, intValue) => [name, makeLogger(name, intValue)]);
};

export { createLogger, LOG_LEVELS };
