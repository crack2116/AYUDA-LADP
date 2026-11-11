import Image from "next/image";

interface BrandMarkProps {
  className?: string;
}

/**
 * Official Asambleas de Dios del Perú logo inside a white disc with the
 * institutional blue → orange → red ring. The source PNG ships with an opaque
 * white background, so it is always presented on a white disc.
 */
export function BrandMark({ className = "h-16 w-16" }: BrandMarkProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full shadow-[0_12px_26px_-12px_rgba(7,42,94,0.55)] ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 140deg, #072a5e, #1157b0, #2286e0, #f06a00, #e01b1b, #ff9a3c, #072a5e)",
        }}
      />
      <span aria-hidden="true" className="absolute inset-[6%] rounded-full bg-white" />
      <Image
        src="/ad-logo.png"
        alt="Logo de las Asambleas de Dios del Perú"
        width={270}
        height={525}
        className="relative h-[76%] w-auto"
      />
    </span>
  );
}
