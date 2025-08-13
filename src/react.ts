import { useEffect, useMemo, useState } from 'react';
import { beam as getBeam, type Scope, configureBeam, FeatureFlag, BeamConfig } from './index';

export { configureBeam };

export interface UseFeatureFlagConfig<T> extends BeamConfig {
    defaultValue?: T;
    deps?: ReadonlyArray<unknown>;
}

export function useFeatureFlag<T = unknown>(
    featureFlag: string,
    options: UseFeatureFlagConfig<T> = {},
    scope?: Scope,
): FeatureFlag & { loading: boolean; refresh: () => Promise<void> } {
    const beam = getBeam();
    const [value, setValue] = useState<T | undefined>(options.defaultValue);
    const [status, setStatus] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const ctxKey = useMemo(() => (scope ? JSON.stringify(scope) : ''), [scope]);

    const fetchOnce = useMemo(() => {
        return async () => {
            setLoading(true);
            try {
                const res = await beam.get(featureFlag, scope);
                setStatus(res.status);
                setValue(res.status ? ((res.value as T | undefined) ?? options.defaultValue) : options.defaultValue);
            } finally {
                setLoading(false);
            }
        };
    }, [beam, featureFlag, ctxKey, options.defaultValue]);

    useEffect(() => {
        fetchOnce();
    }, [fetchOnce, ...(options.deps ?? [])]);

    return { featureFlag, value, status, loading, refresh: () => fetchOnce() };
}
