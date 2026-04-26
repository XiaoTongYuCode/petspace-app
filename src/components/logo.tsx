import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="Petspace home">
      <Image
        src="/brand/petspace-logo.svg"
        alt="Petspace"
        width={154}
        height={31}
        priority
      />
    </Link>
  );
}
