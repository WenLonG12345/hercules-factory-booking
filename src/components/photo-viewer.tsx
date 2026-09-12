"use client";

import Image, { type ImageProps } from "next/image";
import { PhotoProvider as BaseProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

// Raw PhotoView is fine for the CSR admin — its children never cross the RSC
// boundary. Public pages use ZoomImage.
export { PhotoView };

/**
 * Client boundary for react-photo-view so the RSC landing page can use it.
 *
 * `PhotoView`'s `overlay` node is only shown when the provider supplies an
 * `overlayRender` — a function, which an RSC cannot pass down — so it is baked
 * in here and the page only passes caption JSX. Hides with the lib's own
 * chrome (tap to toggle).
 */
export function PhotoProvider(
  props: React.ComponentProps<typeof BaseProvider>,
) {
  return (
    <BaseProvider
      overlayRender={({ overlay }) =>
        overlay ? (
          <div className="on-dark pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-scrim to-transparent px-6 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-sm font-black uppercase tracking-[0.16em] text-ink">
            {overlay}
          </div>
        ) : null
      }
      {...props}
    />
  );
}

/**
 * Zoomable `next/image`. The thumbnail element has to be created on the client:
 * `PhotoView` calls `cloneElement` on its child, and in dev an element
 * serialised from an RSC still has `type === undefined` at that point (React
 * 19.2 Flight debug-owner resolution) — "Element type is invalid".
 */
export function ZoomImage({
  overlay,
  ...img
}: ImageProps & { overlay?: React.ReactNode }) {
  return (
    <PhotoView
      overlay={overlay}
      src={typeof img.src === "string" ? img.src : undefined}
    >
      <Image {...img} />
    </PhotoView>
  );
}
