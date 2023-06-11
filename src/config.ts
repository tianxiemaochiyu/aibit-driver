export type Config = {
  animate?: boolean;
  smoothScroll?: boolean;
  allowClose?: boolean;
  opacity?: number;
  stagePadding?: number;
  stageRadius?: number;
  popoverOffset?: number;
};

let currentConfig: Config = {};

export function configure(config: Config = {}) {
  currentConfig = {
    animate: true,
    allowClose: true,
    opacity: 0.7,
    smoothScroll: false,
    stagePadding: 10,
    stageRadius: 5,
    popoverOffset: 10,
    ...config,
  };
}

export function getConfig(): Config;
export function getConfig<K extends keyof Config>(key: K): Config[K];
export function getConfig<K extends keyof Config>(key?: K) {
  return key ? currentConfig[key] : currentConfig;
}
