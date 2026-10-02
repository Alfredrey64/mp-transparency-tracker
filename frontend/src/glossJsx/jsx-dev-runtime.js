import { jsxDEV as reactJsxDEV, Fragment } from "react/jsx-dev-runtime";
import { prepareProps } from "./prepare";

export { Fragment };
export const jsxDEV = (type, props, key, isStatic, source, self) =>
  reactJsxDEV(type, prepareProps(type, props), key, isStatic, source, self);
