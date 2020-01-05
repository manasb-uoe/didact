import { didactState } from "../core";

export function useRef<T>(initial: T): { current: T } {
  const oldHook =
    didactState.wipFiber.alternate &&
    didactState.wipFiber.alternate.hooks &&
    didactState.wipFiber.alternate.hooks[didactState.hookIndex];

  const hook = {
    value: oldHook ? oldHook.value : { current: initial }
  };

  didactState.wipFiber.hooks.push(hook);
  didactState.hookIndex++;

  return hook.value;
}
