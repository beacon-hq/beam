import { onMounted, reactive, ref, type Ref, watch, type WatchSource } from 'vue';
import { beam as getBeam, BeamConfig, configureBeam, FeatureFlag, type Scope } from './index';

export { configureBeam };

export interface UseFeatureFlagConfig<T> extends BeamConfig {
    deps?: ReadonlyArray<WatchSource | unknown>;
    defaultValue?: T;
}

export function useFeatureFlag<T = unknown>(
    featureFlag: string,
    options: UseFeatureFlagConfig<T> = {},
    scope?: Scope,
): FeatureFlag & { loading: boolean; refresh: () => Promise<void> } {
    const beam = getBeam();
    const _value = ref<T | undefined>(options.defaultValue) as Ref<T | undefined>;
    const _status = ref<boolean>(false);
    const _loading = ref<boolean>(false);

    const fetchOnce = async () => {
        _loading.value = true;
        try {
            const res = await beam.get(featureFlag, scope);
            _status.value = res.status;
            _value.value = res.status ? (res.value as T | undefined) : options.defaultValue;
        } finally {
            _loading.value = false;
        }
    };

    // Start initial fetch onMounted with loading
    onMounted(() => {
        void fetchOnce();
    });

    if (options.deps && options.deps.length > 0) {
        watch(options.deps as ReadonlyArray<WatchSource>, () => {
            void fetchOnce();
        });
    }

    return reactive({
        get featureFlag() {
            return featureFlag;
        },
        get value() {
            return _value.value as T | undefined;
        },
        get status() {
            return _status.value as boolean;
        },
        get loading() {
            return _loading.value as boolean;
        },
        refresh: () => fetchOnce(),
    }) as FeatureFlag & { loading: boolean; refresh: () => Promise<void> };
}
