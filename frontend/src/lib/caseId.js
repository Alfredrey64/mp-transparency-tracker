// The address of a think tank's card on the think tank page, so the scale above it can take you there.
export const caseId = (name) => `tt-case-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
