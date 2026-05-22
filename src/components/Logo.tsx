import Image from "next/image";

export const LOGO_URL =
  "https://static.showit.co/1200/DCkf9Lq274roW0gXPzSgJg/shared/ideas_logo-01.png";

export function Logo({
  width = 120,
  height = 44,
  className = "",
  priority = false
}: {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_URL}
      alt="Ideas, LLC — Rotulación · Impresión · Ingeniería"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ objectFit: "contain", height: "auto" }}
    />
  );
}
