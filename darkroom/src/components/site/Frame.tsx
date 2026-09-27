import clsx from "clsx";
import Image from "next/image";

type Props = {
  src?: string | null;
  alt?: string;
  /** what goes here once it exists, shown on the unexposed frame */
  placeholder: string;
  /** when there is no picture, show this title as an intertitle instead */
  titleCard?: string;
  /** an aspect ratio such as "3 / 2", or null to let the stylesheet decide (a gate that changes shape with the screen) */
  ratio?: string | null;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/**
 * A picture in the room. With no picture, a frame is either the work's own
 * title card (an intertitle) or an unexposed frame: black, a hairline, a focus
 * mark and one line saying what will be there. Never a grey stand-in.
 */
export function Frame({ src, alt = "", placeholder, titleCard, ratio = "3 / 2", sizes = "(min-width: 900px) 45vw, 100vw", priority, className }: Props) {
  const style = ratio ? { aspectRatio: ratio } : undefined;

  if (src) {
    return (
      <div className={clsx("frame", className)} style={style}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  if (titleCard) {
    return (
      <div className={clsx("frame", className)} style={style}>
        <div className="title-card" aria-hidden="true">
          <span className="title-card__text">{titleCard}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("frame frame--unexposed", className)} style={style}>
      {placeholder && <span className="frame__label">{placeholder}</span>}
    </div>
  );
}
