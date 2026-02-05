export const toRGBA = (expressionResult: unknown) => {
  if (
    !expressionResult ||
    !Array.isArray(expressionResult) ||
    expressionResult.length < 3
  ) {
    return `rgba(0, 0, 0, 0)`;
  }
  const [r, g, b, ...rest] = expressionResult;
  const a = rest.length ? rest[0] : 1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
