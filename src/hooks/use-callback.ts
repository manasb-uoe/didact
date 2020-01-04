import { useMemo } from "./use-memo";

export function useCallback<T>(callback: T, deps: any[]): T {
    return useMemo(() => callback, deps);
}
