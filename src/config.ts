import { Driver, DriveStep } from "./driver";
import { PopoverDOM } from "./popover";
import { State } from "./state";

export type DriverHook = (
  element: Element | undefined,
  step: DriveStep,
  opts: { config: Config; state: State; driver: Driver }
) => void;

export enum EnumHightlightType {
  AREA = "area",
  DASHED = "dashed",
}

export type Config = {
  steps?: DriveStep[];

  animate?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  smoothScroll?: boolean;
  allowClose?: boolean;
  overlayClickBehavior?: "close" | "nextStep" | "";
  stagePadding?: number;
  stageTopPadding?: number;
  stageLeftPadding?: number;
  stageRightPadding?: number;
  stageBottomPadding?: number;
  stageRadius?: number;
  hightlightType?: EnumHightlightType;
  lineColor?: string;
  lineWidth?: string;
  lineMargin?: string;
  lineDashArray?: string;
  hiddenArrow?: boolean;

  disableActiveInteraction?: boolean;

  allowKeyboardControl?: boolean;

  // Popover specific configuration
  popoverClass?: string;
  popoverOffset?: number;
  // template
  // showButtons?: AllowedButtons[];
  // disableButtons?: AllowedButtons[];
  // showProgress?: boolean;

  // Button texts
  // progressText?: string;
  nextBtnText?: string;
  // prevBtnText?: string;
  doneBtnText?: string;

  // Called after the popover is rendered
  onPopoverRender?: (popover: PopoverDOM, opts: { config: Config; state: State, driver: Driver }) => void;

  // State based callbacks, called upon state changes
  onHighlightStarted?: DriverHook;
  onHighlighted?: DriverHook;
  onDeselected?: DriverHook;
  onDestroyStarted?: DriverHook;
  onDestroyed?: DriverHook;

  // Event based callbacks, called upon events
  onNextClick?: DriverHook;
  onPrevClick?: DriverHook;
  onCloseClick?: DriverHook;
};

let currentConfig: Config = {};
let currentDriver: Driver;

export function configure(config: Config = {}) {
  currentConfig = {
    animate: true,
    allowClose: true,
    smoothScroll: false,
    disableActiveInteraction: true,
    // showProgress: false,
    stagePadding: 10,
    stageRadius: 12,
    popoverOffset: 8,
    overlayOpacity: 1,
    overlayClickBehavior: "",
    // showButtons: ["next", "previous", "close"],
    // disableButtons: [],
    lineDashArray: "6 4",
    lineWidth: "3",
    overlayColor: "#000",
    hightlightType: EnumHightlightType.AREA,
    hiddenArrow: true,
    ...config,
  };
}

export function getConfig(): Config;
export function getConfig<K extends keyof Config>(key: K): Config[K];
export function getConfig<K extends keyof Config>(key?: K) {
  return key ? currentConfig[key] : currentConfig;
}

export function setCurrentDriver(driver: Driver) {
  currentDriver = driver;
}

export function getCurrentDriver() {
  return currentDriver;
}
