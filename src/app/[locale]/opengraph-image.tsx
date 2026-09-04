/* Hallmark · component-scope: social card (1200×630) · genre: editorial
 * macrostructure: Marquee Hero (banded) — the landing hero, compressed to a card
 * theme: Sport (locked brand system — not rotated)
 * paper band: dark (.on-dark) · display: display-condensed (Archivo Black, roman)
 * accent hue: warm red · enrichment: user-owned crest on a hard-edged plate
 * pre-emit critique: P4 H5 E4 S5 R5 V4
 *
 * Satori parses neither `oklch()` nor CSS custom properties, so the tokens
 * below are the sRGB fall of `globals.css` — same values, converted once.
 * Every colour in the card references `T`; none are written inline.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Without this the card would re-render on every crawler hit; with it, both
// locales bake to a static PNG at build time.
export { generateStaticParams } from "./layout";

export const alt =
  "Hercules Factory — Muay Thai for everyone in Cheras. Beginners, fitness, fighters.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const T = {
  ground: "#160d09", // --color-paper   under .on-dark  oklch(17% .018 40)
  bone: "#f8f5ef", // --color-ink     under .on-dark  oklch(97% .008 85)
  boneDim: "#c1bdb5", // --color-ink-dim under .on-dark  oklch(80% .012 85)
  accent: "#e23532", // --color-accent  under .on-dark  oklch(60% .21 27)
  plate: "#fdfcf9", // --color-paper-2 (light)        oklch(99% .004 85)
  hairline: "rgba(255,255,255,0.15)", // --color-hairline under .on-dark
};

const asset = (p: string) => join(process.cwd(), "assets", p);

const [display, body, crest] = await Promise.all([
  readFile(asset("fonts/Archivo-Black.woff")),
  readFile(asset("fonts/InterTight-Medium.woff")),
  readFile(asset("logo-og.png")),
]);

const crestSrc = `data:image/png;base64,${crest.toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: T.ground,
        color: T.bone,
        fontFamily: "InterTight",
        padding: "56px 64px 0",
      }}
    >
      {/* Masthead — the header pill, flattened to a rule */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          paddingBottom: 28,
          borderBottom: `1px solid ${T.hairline}`,
        }}
      >
        <div style={{ width: 14, height: 14, background: T.accent }} />
        <div
          style={{
            fontFamily: "Archivo",
            fontSize: 22,
            letterSpacing: "0.2em",
          }}
        >
          HERCULES FACTORY
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        <div
          style={{
            fontFamily: "Archivo",
            fontSize: 20,
            letterSpacing: "0.2em",
            color: T.boneDim,
          }}
        >
          CHERAS
        </div>
      </div>

      {/* Marquee */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {/* the .section-head accent rule */}
          <div style={{ width: 72, height: 10, background: T.accent }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 26,
              fontFamily: "Archivo",
              fontSize: 82,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
            }}
          >
            <div style={{ display: "flex" }}>MUAY THAI</div>
            <div style={{ display: "flex" }}>FOR EVERYONE</div>
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 27,
              color: T.boneDim,
              letterSpacing: "0.01em",
            }}
          >
            Beginners · Fitness · Fighters
          </div>
        </div>

        {/* Crest on a hard-edged plate — the Why-section card, verbatim */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 300,
            background: T.plate,
          }}
        >
          <div style={{ height: 12, background: T.accent }} />
          <img alt="" src={crestSrc} width={300} height={300} />
        </div>
      </div>

      {/* Closing band */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "26px 0 30px",
          borderTop: `1px solid ${T.hairline}`,
          fontFamily: "Archivo",
          fontSize: 21,
          letterSpacing: "0.16em",
        }}
      >
        <div style={{ display: "flex", color: T.boneDim }}>
          GROUP · KIDS · PERSONAL TRAINING
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", color: T.accent }}>BOOK ON WHATSAPP</div>
      </div>

      {/* Ring-rope foot */}
      <div
        style={{
          display: "flex",
          height: 14,
          margin: "0 -64px",
          background: T.accent,
        }}
      />
    </div>,
    {
      ...size,
      fonts: [
        { name: "Archivo", data: display, weight: 900, style: "normal" },
        { name: "InterTight", data: body, weight: 500, style: "normal" },
      ],
    },
  );
}
