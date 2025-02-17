import { easeInOutQuad } from "./utils";
import { onDriverClick } from "./events";
import { emit } from "./emitter";
import { getConfig, EnumHightlightType } from "./config";
import { getState, setState } from "./state";

export type StageDefinition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function disableWheelEvent(event: Event) {
  event.preventDefault();
}

// This method calculates the animated new position of the
// stage (called for each frame by requestAnimationFrame)
export function transitionStage(elapsed: number, duration: number, from: Element, to: Element) {
  let activeStagePosition = getState("__activeStagePosition");

  const fromDefinition = activeStagePosition ? activeStagePosition : from.getBoundingClientRect();
  const toDefinition = to.getBoundingClientRect();

  const x = easeInOutQuad(elapsed, fromDefinition.x, toDefinition.x - fromDefinition.x, duration);
  const y = easeInOutQuad(elapsed, fromDefinition.y, toDefinition.y - fromDefinition.y, duration);
  const width = easeInOutQuad(elapsed, fromDefinition.width, toDefinition.width - fromDefinition.width, duration);
  const height = easeInOutQuad(elapsed, fromDefinition.height, toDefinition.height - fromDefinition.height, duration);

  activeStagePosition = {
    x,
    y,
    width,
    height,
  };

  renderOverlay(activeStagePosition);
  setState("__activeStagePosition", activeStagePosition);
}

export function trackActiveElement(element: Element) {
  if (!element) {
    return;
  }

  const definition = element.getBoundingClientRect();

  const activeStagePosition: StageDefinition = {
    x: definition.x,
    y: definition.y,
    width: definition.width,
    height: definition.height,
  };

  setState("__activeStagePosition", activeStagePosition);

  renderOverlay(activeStagePosition);
}

export function refreshOverlay() {
  const activeStagePosition = getState("__activeStagePosition");
  const overlaySvg = getState("__overlaySvg");

  if (!activeStagePosition) {
    return;
  }

  if (!overlaySvg) {
    console.warn("No stage svg found.");
    return;
  }

  const windowX = window.innerWidth;
  const windowY = window.innerHeight;

  overlaySvg.setAttribute("viewBox", `0 0 ${windowX} ${windowY}`);
}

function mountOverlay(stagePosition: StageDefinition) {
  const overlaySvg = createOverlaySvg(stagePosition);
  document.body.appendChild(overlaySvg);

  onDriverClick(overlaySvg, e => {
    const target = e.target as SVGElement;
    if (target.tagName !== "path") {
      return;
    }

    emit("overlayClick");
  });

  setState("__overlaySvg", overlaySvg);
}

function renderOverlay(stagePosition: StageDefinition) {
  
  const overlaySvg = getState("__overlaySvg");

  // TODO: cancel rendering if element is not visible
  if (!overlaySvg) {
    mountOverlay(stagePosition);

    return;
  }


  const pathElement = overlaySvg.firstElementChild as SVGPathElement | null;
  if (pathElement?.tagName !== "path") {
    throw new Error("no path element found in stage svg");
  }
  pathElement.setAttribute("d", generateStageSvgPathString(stagePosition));

  const hightlightStyle = getConfig("hightlightType") || EnumHightlightType.AREA
  if (hightlightStyle === EnumHightlightType.DASHED) {
    const pathElementDashed = overlaySvg.lastElementChild as SVGPathElement | null;
    if (pathElementDashed?.tagName !== "path") {
      throw new Error("no path element found in stage svg");
    }
    pathElementDashed.setAttribute("d", generateDashedStageSvgPathString(stagePosition));
  }
}

function createOverlaySvg(stage: StageDefinition): SVGSVGElement {
  const windowX = window.innerWidth;
  const windowY = window.innerHeight;

  const hightlightStyle = getConfig("hightlightType") || EnumHightlightType.AREA

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("driver-overlay", "driver-overlay-animated");

  svg.setAttribute("viewBox", `0 0 ${windowX} ${windowY}`);
  svg.setAttribute("xmlSpace", "preserve");
  svg.setAttribute("xmlnsXlink", "http://www.w3.org/1999/xlink");
  svg.setAttribute("version", "1.1");
  svg.setAttribute("preserveAspectRatio", "xMinYMin slice");

  svg.style.fillRule = "evenodd";
  svg.style.clipRule = "evenodd";
  svg.style.strokeLinejoin = "round";
  svg.style.strokeMiterlimit = "2";
  svg.style.zIndex = "10000";
  svg.style.position = "fixed";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";

  const stagePath = document.createElementNS("http://www.w3.org/2000/svg", "path");

  stagePath.setAttribute("d", generateStageSvgPathString(stage));

  stagePath.style.fill = getConfig("overlayColor") || "rgb(0,0,0)";
  stagePath.style.opacity = `${getConfig("overlayOpacity")}`;
  stagePath.style.pointerEvents = "auto";
  stagePath.style.cursor = "auto";

  svg.appendChild(stagePath);

  // 绘制高亮虚线
  if (hightlightStyle === EnumHightlightType.DASHED) {
    const stageDashedPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    stageDashedPath.setAttribute("d", generateDashedStageSvgPathString(stage));

    const lineColor = getConfig("lineColor") || "rgba(0, 0, 0, 0.50)";
    const lineWidth = getConfig("lineWidth") || "3";
    const lineDashArray = getConfig("lineDashArray") || "8 8";

    stageDashedPath.style.fill = "none";
    stageDashedPath.style.stroke = lineColor;
    stageDashedPath.style.strokeWidth = lineWidth;
    stageDashedPath.style.strokeDasharray = lineDashArray

    svg.appendChild(stageDashedPath);
  }

  svg.addEventListener("wheel", disableWheelEvent, { passive: false })

  return svg;
}

function generateStageSvgPathString(stage: StageDefinition) {
  const windowX = window.innerWidth;
  const windowY = window.innerHeight;



  const stagePadding = getConfig("stagePadding") || 0;
  const stageRadius = getConfig("stageRadius") || 0;

  const stageTopPadding = getConfig("stageTopPadding") || stagePadding;
  const stageLeftPadding = getConfig("stageLeftPadding") || stagePadding;
  const stageRightPadding = getConfig("stageRightPadding") || stagePadding;
  const stageBottomPadding = getConfig("stageBottomPadding") || stagePadding;

  const stageWidth = stage.width + stageLeftPadding + stageRightPadding;
  const stageHeight = stage.height + stageTopPadding + stageBottomPadding;

  // prevent glitches when stage is too small for radius
  const limitedRadius = Math.min(stageRadius, stageWidth / 2, stageHeight / 2);

  // no value below 0 allowed + round down
  const normalizedRadius = Math.floor(Math.max(limitedRadius, 0));

  const highlightBoxX = stage.x - stageLeftPadding + normalizedRadius;
  const highlightBoxY = stage.y - stageTopPadding;
  const highlightBoxWidth = stageWidth - normalizedRadius * 2;
  const highlightBoxHeight = stageHeight - normalizedRadius * 2;

  return `M${windowX},0L0,0L0,${windowY}L${windowX},${windowY}L${windowX},0Z
    M${highlightBoxX},${highlightBoxY} h${highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},${normalizedRadius} v${highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},${normalizedRadius} h-${highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},-${normalizedRadius} v-${highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},-${normalizedRadius} z`;
}

// 高亮虚线圈
function generateDashedStageSvgPathString(stage: StageDefinition) {

  const stagePadding = getConfig("stagePadding") || 0;
  const stageRadius = getConfig("stageRadius") || 0;

  const stageTopPadding = getConfig("stageTopPadding") || stagePadding;
  const stageLeftPadding = getConfig("stageLeftPadding") || stagePadding;
  const stageRightPadding = getConfig("stageRightPadding") || stagePadding;
  const stageBottomPadding = getConfig("stageBottomPadding") || stagePadding;

  const stageWidth = stage.width + stageLeftPadding + stageRightPadding;
  const stageHeight = stage.height + stageTopPadding + stageBottomPadding

  // prevent glitches when stage is too small for radius
  const limitedRadius = Math.min(stageRadius, stageWidth / 2, stageHeight / 2);

  // no value below 0 allowed + round down
  const normalizedRadius = Math.floor(Math.max(limitedRadius, 0));

  const highlightBoxX = stage.x - stageLeftPadding + normalizedRadius + 1;
  const highlightBoxY = stage.y - stageTopPadding + 1;
  const highlightBoxWidth = stageWidth - normalizedRadius * 2 - 1 * 2;
  const highlightBoxHeight = stageHeight - normalizedRadius * 2 - 1 * 2;

  return `M${highlightBoxX},${highlightBoxY} h${highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},${normalizedRadius} v${highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},${normalizedRadius} h${-highlightBoxWidth} a${normalizedRadius},${normalizedRadius} 0 0 1 -${normalizedRadius},${-normalizedRadius} v${-highlightBoxHeight} a${normalizedRadius},${normalizedRadius} 0 0 1 ${normalizedRadius},${-normalizedRadius} z`;
}

export function destroyOverlay() {
  const overlaySvg = getState("__overlaySvg");
  if (overlaySvg) {
    overlaySvg.removeEventListener("wheel", disableWheelEvent)
    overlaySvg.remove();
  }
}
