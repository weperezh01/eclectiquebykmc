import * as React from "react";

type Props = {
  size?: number;           // logical px (default 128)
  className?: string;
  priority?: boolean;      // if true, don't set loading="lazy"
};

export function Logo({ size = 128, className = "", priority = true }: Props) {
  // Use optimized PNG with transparent background
  // Choose appropriate size based on requested size
  let src = "/brand/eclectique-by-kmc-logo-128.png";
  if (size > 256) {
    src = "/brand/eclectique-by-kmc-logo-512.png";
  } else if (size > 128) {
    src = "/brand/eclectique-by-kmc-logo-256.png";
  }
  
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={className}
      alt="Éclectique by KMC logo"
      {...(!priority ? { loading: "lazy" } : {})}
    />
  );
}

export default Logo;