export const isFunc = (val) => {
  return typeof val === "function";
};
export const mapObj = (obj, fn) => {
  const mappedAsArr = Object.entries(obj).map(([k, v]) => fn(k, v));
  return Object.fromEntries(mappedAsArr);
};
export const invokeIfFunction = (val) => {
  return isFunc(val) ? val() : val;
};
export const wrapOneFunction = (val) => {
  return isFunc(val) ? val : () => val;
};

export const toObj = (arr, subObjSelector) =>
  arr.reduce((acc, curr) => {
    const objToAdd = subObjSelector(curr);
    return { ...acc, ...objToAdd };
  }, {});

export const isPlainObj = (val) =>
  !Array.isArray(val) && typeof val === "object" && val !== null;

export const flattenObjHash = (obj) => {
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

export const tryParseJson = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};
