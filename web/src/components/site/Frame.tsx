import clsx from "clsx";
import Image from "next/image";

type Props = {
  src?: string | null;
  alt?: string;
  /** what goes here once it exists, shown on the drafted placeholder */
  placeholder: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  ticks?: boolean;
};

/**
 * An image in a drawn frame. When there is no image yet the frame is drafted
 * in blue with a diagonal cross, which is this site's native way of saying
 * "not inked yet" rather than a grey box pretending to be a photograph.
 */
export function Frame({ src, alt = "", placeholder, ratio = "3 / 2", sizes = "(min-width: 900px) 45vw, 100vw", priority, className, ticks = true }: Props) {
  return (
    <div className={clsx("frame", !src && "frame--empty", ticks && "ticks", className)} style={{ aspectRatio: ratio }}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span className="frame__label">{placeholder}</span>
      )}
    </div>
  );
}
