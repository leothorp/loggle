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
