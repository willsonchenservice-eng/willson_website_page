export type ShowcaseImageFit = "contain" | "cover-top";

export const SHOWCASE_FRAME_WIDTH = 4434;
export const SHOWCASE_FRAME_HEIGHT = 2986;
export const SHOWCASE_FRAME_ASPECT = SHOWCASE_FRAME_WIDTH / SHOWCASE_FRAME_HEIGHT;

const animatedImagePattern = /\.(?:gif)(?:$|[?#])/i;
const videoSourcePattern = /\.(?:mp4|webm|mov|m4v|ogg|ogv)(?:$|[?#])/i;

export function isShowcaseVideoSource(source: string = "") {
  return videoSourcePattern.test(source);
}

export function getShowcaseImageFit(
  width: number,
  height: number,
  source: string = ""
): ShowcaseImageFit {
  if (animatedImagePattern.test(source) || isShowcaseVideoSource(source)) return "contain";
  if (!Number.isFinite(width) || !Number.isFinite(height)) return "contain";
  if (width <= 0 || height <= 0) return "contain";

  return width / height < SHOWCASE_FRAME_ASPECT ? "cover-top" : "contain";
}

export function getShowcaseImageFitClass(fit: ShowcaseImageFit) {
  return fit === "cover-top" ? "object-cover object-top" : "object-contain";
}
