export const getBooleanEnvVar = (varName: string): boolean => {
  const v = process.env[varName];
  if (!v) {
    return false;
  }
  return v !== "0" && v.toLowerCase() !== "false";
};
