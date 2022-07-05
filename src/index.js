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
  //globally enable/disable logging
  enabled: true,
  level: DEFAULT_LOG_LEVEL, //suggest setting this via environment variable
  formatLogSegments: (elements) => elements.join(" "), //formatter for each comma separated argument passed to the logging func (prefix is included as first param)
  prefix: {
    //pass false to disable
    includeLevelName: true,
    includeTime: true,
    getCurrentTimeString: () =>
      new Date().toLocaleTimeString("en-US", { hour12: false }),
    getRestOfPrefix: () => [],
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
    func: ({ message, metadata, config }) => console.log(message, metadata), //function to pass each log to.
  },
  metadataConfig: {
    //obj of arbitrary additional key/value pairs to include
    includeInMessageString: false, //whether to tack metadata.properties onto end of message string logged, or only include as additional param to sink endpoints/functions
  },
  localOverrideKeys: {
    config: "config",
    metadata: "metadata",
  },

  //TODO(lt): filter via regex

  filter: ({ message, metadata }) => true, //function for filtering logs based on message content/metadata

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

    return [k, inputConfigVal.hasOwnProperty(k) ? inputConfigVal[k] : v];
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
    ...config.prefix.getRestOfPrefix(),
  ];
  // const prefix = [`%c[${includeLevelName && name}`, config.prefix.getCurrentTimeString()]`].join(
  //   " "
  // );
  const prefixStr = config.formatLogSegments(prefixElements);
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
const DEFAULT_LOCAL_OVERRIDE_KEYS = {
  config: "config",
  metadata: "metadata",
};
const getLocalOverrides = (obj, globalConfig) => {
  //in case they wiped out this property with their own config
  const localOverrideKeyMap =
    globalConfig.localOverrideKeys || DEFAULT_LOCAL_OVERRIDE_KEYS;
  const keys = Object.keys(obj);
  const isLocalOverride =
    keys.length > 0 &&
    keys.length <= 2 &&
    keys.every((k) => localOverrideKeyMap.hasOwnProperty(k));

  if (isLocalOverride) {
    return mapObj(localOverrideKeyMap, (origKey, mappedKey) => [
      origKey,
      obj[mappedKey],
    ]);
  } else {
    return { config: null, metadata: null };
  }
};

const defaultMetadata = () => ({ clientTimestamp: Date.now() });

const createLogger = ({
  config: inputConfig = defaultConfig,
  metadata: globalMetadata = defaultMetadata,
}) => {
  const globalConfig = mergeConfigs(defaultConfig, inputConfig);
  const makeLevelLogger =
    (levelName, intVal) =>
    (...baseLogArgs) => {
      //TODO(lt): vvv how differentiate another obj they want to send with same keys?
      //localOverrideKeys is for that.
      const { config: baseLogConfig, metadata: baseLogMetadata } =
        getLocalOverrides(baseLogArgs[0], globalConfig);
      const hasAdditionalConfig = !!baseLogConfig;
      const hasAdditionalMetadata = !!baseLogMetadata;
      const config = hasAdditionalConfig
        ? mergeConfigs(globalConfig, baseLogConfig)
        : globalConfig;
      const logArgs = hasAdditionalConfig ? baseLogArgs.slice(1) : baseLogArgs;

      if (!config.enabled || intVal > config.level) {
        return;
      }

      const metadata = hasAdditionalMetadata
        ? mergeConfigs(globalMetadata, baseLogMetadata)
        : globalMetadata;

      const allLogSegments = [
        ...getPrefixSegments(levelName, config),
        ...logArgs,
        config.metadataConfig.includeInMessageString && metadata,
      ].filter((x) => x);

      const message = config.formatLogSegments(allLogSegments);
      if (!config.filter({ message, metadata, config })) {
        return;
      }
      config.sink.func({ message, metadata, config });
      if (config.sink.endpoint) {
        post(config.sink.endpoint, { message, metadata, config });
      }
    };
  const levelLoggers = mapObj(LOG_LEVELS, (name, intValue) => {

    return [
      name,
      makeLevelLogger(name, intValue),
    ]
  });

  return {
    ...levelLoggers,
    createSubLogger: ({ config: subConfig, metadata: subMetadata }) => {
      return createLogger({
        config: mergeConfigs(globalConfig, subConfig),
        metadata: mergeConfigs(globalMetadata, subMetadata),
      });
    },
  };
};

export { createLogger, LOG_LEVELS };
