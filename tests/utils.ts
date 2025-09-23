export const sleep = (millis: number): Promise<void> => {
  return new Promise((r) => {
    setTimeout(r, millis);
  });
};
