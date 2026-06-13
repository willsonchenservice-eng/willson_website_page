export type ShowcaseImageFit = "contain" | "cover-top" | "contain-mobile-cover-top-desktop";

export const SHOWCASE_MOBILE_FRAME_WIDTH = 1400;
export const SHOWCASE_MOBILE_FRAME_HEIGHT = 1051;
export const SHOWCASE_MOBILE_FRAME_ASPECT =
  SHOWCASE_MOBILE_FRAME_WIDTH / SHOWCASE_MOBILE_FRAME_HEIGHT;
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

  const imageAspect = width / height;
  if (imageAspect >= SHOWCASE_FRAME_ASPECT) return "contain";
  if (imageAspect >= SHOWCASE_MOBILE_FRAME_ASPECT * 0.98) {
    return "contain-mobile-cover-top-desktop";
  }

  return "cover-top";
}

export function getShowcaseImageFitClass(fit: ShowcaseImageFit) {
  if (fit === "contain-mobile-cover-top-desktop") {
    return "object-contain md:object-cover md:object-top";
  }
  return fit === "cover-top" ? "object-cover object-top" : "object-contain";
}
