import React from "react";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({
  className = "h-8 w-auto object-contain rounded-sm dark:invert dark:mix-blend-screen",
  alt = "AvenorHub",
}: LogoProps) {
  return (
    <img
      src="/avenor-logo.jpg"
      alt={alt}
      className={className}
    />
  );
}

export default Logo;
