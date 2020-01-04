import { useMemo } from "./use-memo";

export function useCallback(callback, deps: any[]) {
    return useMemo(() => callback, deps);
}
