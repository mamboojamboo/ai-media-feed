export function rafThrottle<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
) {
  let frameId = 0;
  let latestArgs: TArgs | null = null;

  return (...args: TArgs) => {
    latestArgs = args;

    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;

      if (latestArgs) {
        callback(...latestArgs);
        latestArgs = null;
      }
    });
  };
}
