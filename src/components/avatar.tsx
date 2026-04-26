import Image from "next/image";
import { initials } from "@/lib/format";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
};

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} relative shrink-0 overflow-hidden rounded-full border border-black/10 bg-[#17120d] text-[#fff7ea]`}
    >
      {src ? (
        <Image
          src={src}
          alt={`${name} 的头像`}
          fill
          sizes="96px"
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold">
          {initials(name)}
        </span>
      )}
    </div>
  );
}
