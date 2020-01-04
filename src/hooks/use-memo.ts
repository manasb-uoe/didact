import { didactState } from "../core";
import { isEqual } from "lodash";

export function useMemo<T>(compute: () => T, deps: any[]): T {
    const oldHook =
        didactState.wipFiber.alternate &&
        didactState.wipFiber.alternate.hooks &&
        didactState.wipFiber.alternate.hooks[didactState.hookIndex];

    const hook = {
        value: null,
        deps
    };

    if (oldHook) {
        if (isEqual(oldHook.deps, hook.deps)) {
            hook.value = oldHook.value;
        } else {
            hook.value = compute();
        }
    } else {
        hook.value = compute();
    }

    didactState.wipFiber.hooks.push(hook);
    didactState.hookIndex++;

    return hook.value;
}
