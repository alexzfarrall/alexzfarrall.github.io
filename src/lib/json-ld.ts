const BACKSLASH = String.fromCharCode(92);
const ESCAPED_LT = `${BACKSLASH}${'u003c'}`;

/** Serialise JSON-LD for an inline script: escape "<" so data can never close the tag. */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, () => ESCAPED_LT);
