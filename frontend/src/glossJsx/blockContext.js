import { createContext } from "react";

// True anywhere beneath a link, button or other clickable element, where a
// glossary term (itself a button) can't be nested.
export const GlossBlockedContext = createContext(false);
