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
const defaultMetadata = () => ({ clientTimestamp: Date.now() });

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
    format: (segments) => `[${segments.join(" ")}]`,
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
    func: ({ message: { asSegments, asString }, metadata }) => {
     console.log(...asSegments)
    }, //function to pass each log to.
  },
  //obj (or function returning obj) of arbitrary additional key/value pairs to include
  metadata: defaultMetadata,
  // localOverrideKeys: {
  //   config: "config",
  //   metadata: "metadata",
  // },

  //TODO(lt): filter via regex

  filter: ({ message, metadata }) => true, //function for filtering logs based on message content/metadata

  //TODO: batch option for sending
};
const toObj = (arr, subObjSelector) => arr.reduce((acc, curr) => {
  const objToAdd = subObjSelector(curr);
return {...acc, ...objToAdd}
}, {})

const isPlainObj = val => !Array.isArray(val) && typeof val === "object" && val !== null
const flattenObjHash = obj => {
  return toObj(Object.keys(obj), k => {
    if (isPlainObj(obj[k])) {
      return { [k]: true, ...flattenObjHash(obj[k]) }

    }
    return { [k]: true }
  })
}
const flattenedConfigKeysHash = flattenObjHash(defaultConfig)
console.log(flattenedConfigKeysHash)
const isPlainConfigObj = (val) => {
  return isPlainObj(val) && Object.keys(val).every(k => flattenedConfigKeysHash.hasOwnProperty(k));
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
    return [];
  }
  const prefixElements = [
    config.prefix.includeLevelName && levelName,
    config.prefix.includeTime && config.prefix.getCurrentTimeString(),
    ...config.prefix.getRestOfPrefix(),
  ];

  const formatChar = config.prefix.colors ? "%c" : ""
  const prefixStr =  formatChar + config.prefix.format(prefixElements);
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

//TODO(lt): remove below
// const DEFAULT_LOCAL_OVERRIDE_KEYS = {
//   config: "config",
//   metadata: "metadata",
// };

// const getLocalOverrides = (obj, globalConfig) => {
//   //in case they wiped out this property with their own config
//   const localOverrideKeyMap =
//     globalConfig.localOverrideKeys || DEFAULT_LOCAL_OVERRIDE_KEYS;
//   const keys = Object.keys(obj);
//   const isLocalOverride =
//     keys.length > 0 &&
//     keys.length <= 2 &&
//     keys.every((k) => localOverrideKeyMap.hasOwnProperty(k));

//   if (isLocalOverride) {
//     return mapObj(localOverrideKeyMap, (origKey, mappedKey) => [
//       origKey,
//       obj[mappedKey],
//     ]);
//   } else {
//     return { config: null, metadata: null };
//   }
// };

const getLocalOverrides = (obj) => {
  if (isPlainConfigObj(obj)) {
    const { metadata, ...config } = obj;
    return {config, metadata, }
  } else {
    return { config: null, metadata: null };
  }
}


// const normalizeConfigMeta = (rawInputConfig) => {
//   const normalizedMetaInputConfig = {...rawInputConfig, metadata: invokeIfFunction(rawInputConfig.metadata)}
//   return normalizedMetaInputConfig
// }
const invokeIfFunction = val => typeof val === "function" ? val() : val
//TODO(lt): vvv streamline API, just put everything at top level (with metadata as property.)
const createLogger = (rawInputConfig = defaultConfig) => {
  const globalConfig = mergeConfigs(defaultConfig,rawInputConfig);
  const makeLevelLogger = (levelName, intVal) => {
    return (...baseLogArgs) => {
      //TODO(lt): vvv how differentiate another obj they want to send with same keys?
      //localOverrideKeys is for that.
     
      
      const hasAdditionalConfig = isPlainConfigObj(baseLogArgs[0]);
      const config = hasAdditionalConfig
        ? mergeConfigs(globalConfig, baseLogArgs[0])
        : globalConfig;
      const logArgs = hasAdditionalConfig ? baseLogArgs.slice(1) : baseLogArgs;

      if (!config.enabled || intVal > config.level) {
        return;
      }
      const metadata = invokeIfFunction(config.metadata)




      const allLogSegments = [
        ...getPrefixSegments(levelName, config),
        ...logArgs,

      ].filter((x) => x);

      const asString = config.formatLogSegments(allLogSegments);
      if (!config.filter({ message: {asString, asSegments: allLogSegments}, metadata })) {
        return;
      }
      config.sink.func({ message: {asString, asSegments: allLogSegments}, metadata });
      if (config.sink.endpoint) {
        post(config.sink.endpoint, { message: {asString, asSegments : allLogSegments}, metadata });
      }
    };
  }

  const levelLoggers = mapObj(LOG_LEVELS, (name, intValue) => {

    return [
      name,
      makeLevelLogger(name, intValue),
    ]
  });

  return {
    ...levelLoggers,
    createSubLogger: (subConfig) => {
      return createLogger(
        ...mergeConfigs(globalConfig, subConfig),
);
    },
  };
};

export { createLogger, LOG_LEVELS };
