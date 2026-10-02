import { jsx as reactJsx, jsxs as reactJsxs, Fragment } from "react/jsx-runtime";
import { prepareProps } from "./prepare";

export { Fragment };
export const jsx = (type, props, key) => reactJsx(type, prepareProps(type, props), key);
export const jsxs = (type, props, key) => reactJsxs(type, prepareProps(type, props), key);
