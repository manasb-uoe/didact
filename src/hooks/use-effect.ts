import { didactState } from "../core";
import { isEqual } from "lodash";

export function useEffect(callback: () => void, deps: any[]) {
    const oldHook =
        didactState.wipFiber.alternate &&
        didactState.wipFiber.alternate.hooks &&
        didactState.wipFiber.alternate.hooks[didactState.hookIndex];

    const hook = {
        deps
    };

    if (!oldHook) {
        // invoke callback if this is the first time
        callback();
    } else {
        if (!isEqual(oldHook.deps, hook.deps)) {
            callback();
        }
    }

    didactState.wipFiber.hooks.push(hook);
}
