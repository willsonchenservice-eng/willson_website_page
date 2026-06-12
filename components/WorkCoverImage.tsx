"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";

export const WORK_COVER_PLACEHOLDER = "/work/_placeholder.svg";

interface WorkCoverImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
}

export default function WorkCoverImage({
  src,
  fallbackSrc = WORK_COVER_PLACEHOLDER,
  onError,
  ...props
}: WorkCoverImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <img
      {...props}
      src={currentSrc}
      onError={(event) => {
        onError?.(event);
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
