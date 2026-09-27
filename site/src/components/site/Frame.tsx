import clsx from "clsx";
import Image from "next/image";

type Props = {
  src?: string | null;
  alt?: string;
  /** what goes here once it exists, shown in the empty frame */
  placeholder: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/** A picture in a rounded frame, or a quiet grey frame that says what will go there. */
export function Frame({ src, alt = "", placeholder, ratio = "3 / 2", sizes = "(min-width: 720px) 42rem, 100vw", priority, className }: Props) {
  return (
    <div className={clsx("frame", className)} style={{ aspectRatio: ratio }}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span className="frame__label">{placeholder}</span>
      )}
    </div>
  );
}
