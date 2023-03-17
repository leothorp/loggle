import { createLogger } from "../index.js";
//TODO(lt): vvv incorporate sinon or mocha, more tests
const assertEqual = (actual, expected, msg = "assertion failed.") => {
  if (actual !== expected) {
    console.error(`Expected: ${expected}}`);
    console.error(`Actual: ${actual}}`);
    throw new Error(msg);
  }
};
const testBasicOutput = () => {
  const msg = "hello world";
  const log = createLogger({
    prefix: {
      colors: false,
      includeTime: false,
      format: (parts) => `<${parts.join("__")}>:`,
    },
    sink: {
      func: ({ message: { asString } }) => {
        assertEqual(asString, `<info>: ${msg}`);
        console.log("sink func called");
      },
    },
  });

  log.info(msg);
};

testBasicOutput();
