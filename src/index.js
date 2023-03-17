import {
  defaultConfig,
  isPlainConfigObj,
  LOG_LEVELS,
} from "./defaultConfig.js";
import { post } from "./request.js";
import {
  invokeIfFunction,
  mapObj,
  tryParseJson,
  wrapOneFunction,
} from "./utils.js";

const mergeConfigs = (defaultConfigVal, inputConfigVal) => {
  if (inputConfigVal.replaceParentConfig) {
    return inputConfigVal;
  }
  if (inputConfigVal.replaceParentMetadata && !!defaultConfigVal.metadata) {
    return mergeConfigs(
      { ...defaultConfigVal, metadata: null },
      inputConfigVal
    );
  }
  //special case for merging multiple metadata function outputs;
  //create array of functions to invoke later
  const metadataFields = [defaultConfigVal.metadata, inputConfigVal.metadata];
  if (metadataFields.every((x) => x)) {
    const mergedMetadata = metadataFields.map(wrapOneFunction);
    return mergeConfigs(
      { ...defaultConfigVal, metadata: null },
      { ...inputConfigVal, metadata: mergedMetadata }
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
  ].filter((x) => x);

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

// shared global BroadcastChannel instance across all logger instances to reduce mem usage. lazily initialized on first usage
let bc = null;

const createLogger = (rawInputConfig = defaultConfig) => {
  const globalConfig = mergeConfigs(defaultConfig, rawInputConfig);
  const makeLevelLogger = (levelName, intVal) => {
    // only show BroadcastChannel browser compat warning once
    let hasShownBcIncompatibilityMsg = false;

    return (...baseLogArgs) => {
      // try/catch wrapper to swallow any errors in custom sink func/other logging code
      try {
        const hasAdditionalConfig = isPlainConfigObj(baseLogArgs[0]);

        const config = hasAdditionalConfig
          ? mergeConfigs(globalConfig, baseLogArgs[0])
          : globalConfig;

        const logArgs = hasAdditionalConfig
          ? baseLogArgs.slice(1)
          : baseLogArgs;

        if (!config.enabled || intVal > normalizeLevel(config.level)) {
          return;
        }
        const metadata = {
          ...(Array.isArray(config.metadata)
            ? config.metadata.reduce(
                (acc, curr) => Object.assign(acc, curr()),
                {}
              )
            : invokeIfFunction(config.metadata)),
          level: levelName,
        };

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
          //remove color string formatting/prefix segment
          const segmentsForEndpoint = assembleSegments(
            logArgs,
            levelName,
            config,
            false
          );

          //fire and forget log payload to sink HTTP endpoint.
          //TODO: batching/retry options, captureErrors option

          post(config.sink.endpoint, {
            message: {
              asString: config.formatLogSegments(segmentsForEndpoint),
              asSegments: segmentsForEndpoint,
            },
            metadata,
          });
        }

        if (config.sink.aggregateTabs) {
          if (!("BroadcastChannel" in window)) {
            if (!hasShownBcIncompatibilityMsg) {
              console.log(
                "BroadcastChannel not supported in this browser. Disabling tab log aggregation."
              );
            }
          } else {
            if (!bc) {
              bc = new BroadcastChannel("_loggle_aggregated_tab_logs");
              bc.addEventListener("message", (event) => {
                if (event.data.type === "log") {
                  console.log(...event.data.args.map((s) => tryParseJson(s)));
                }
              });
            }

            bc.postMessage({
              type: "log",

              args: allLogSegments.map((s) =>
                typeof s === "object" ? JSON.stringify(s) : s
              ),
            });
          }
        } else {
          // allow GC of broadcastchannel instance if config changed to disable
          if (bc) {
            bc.close();
            bc = null;
          }
        }
      } catch {
        console.error(
          "An error occurred during log execution. Args:",
          ...baseLogArgs
        );
      }
    };
  };

  const levelLoggers = mapObj(LOG_LEVELS, (name, intValue) => {
    return [name, makeLevelLogger(name, intValue)];
  });

  return {
    ...levelLoggers,
    createSubLogger: (subConfig) => {
      return createLogger(mergeConfigs(globalConfig, subConfig));
    },
  };
};

export { createLogger, LOG_LEVELS };
