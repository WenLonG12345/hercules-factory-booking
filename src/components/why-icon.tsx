/* Hallmark · component: why-icon · genre: editorial · theme: Sport
 * Game Icons (via react-icons/gi) — solid, hand-drawn silhouettes rather than
 * the uniform hairline icon sets every generated page reaches for. Keyed off
 * the `emoji` column the CMS already stores per row, so changing the emoji in
 * the admin changes the mark on the public page and reordering rows can't
 * desync them. Licence: Game Icons is CC BY 3.0 — credit belongs in the footer.
 * pre-emit critique: P5 H4 E5 S5 R5 V4
 */
import type { IconType } from "react-icons";
import {
  GiArcheryTarget,
  GiBlackBelt,
  GiBoxingGlove,
  GiBoxingRing,
  GiFlame,
  GiHeartInside,
  GiHighKick,
  GiKimono,
  GiMedal,
  GiMeditation,
  GiMuscleUp,
  GiPunch,
  GiPunchingBag,
  GiShakingHands,
  GiShield,
  GiSkippingRope,
  GiStarMedal,
  GiStopwatch,
  GiThreeFriends,
  GiTrophyCup,
  GiWhistle,
} from "react-icons/gi";

// Keys are stripped of the U+FE0F variation selector before lookup, so both
// "❤️" and "❤" resolve to the same mark.
const BY_EMOJI: Record<string, IconType> = {
  "\u{1F94A}": GiBoxingGlove, // 🥊
  "\u{1F44A}": GiPunch, // 👊
  "\u{1F525}": GiFlame, // 🔥
  "\u{2764}": GiHeartInside, // ❤️
  "\u{1F3C6}": GiTrophyCup, // 🏆
  "\u{1F91D}": GiShakingHands, // 🤝
  "\u{1F4AA}": GiMuscleUp, // 💪
  "\u{1F94B}": GiKimono, // 🥋
  "\u{1F9B5}": GiHighKick, // 🦵
  "\u{23F1}": GiStopwatch, // ⏱️
  "\u{1F3AF}": GiArcheryTarget, // 🎯
  "\u{1F6E1}": GiShield, // 🛡️
  "\u{1F465}": GiThreeFriends, // 👥
  "\u{1F3C5}": GiMedal, // 🏅
  "\u{1F947}": GiStarMedal, // 🥇
  "\u{2B50}": GiStarMedal, // ⭐
  "\u{1F3CB}": GiPunchingBag, // 🏋️
  "\u{1F938}": GiSkippingRope, // 🤸
  "\u{1F3C3}": GiSkippingRope, // 🏃
  "\u{1F9D8}": GiMeditation, // 🧘
  "\u{1F945}": GiBoxingRing, // 🥅
  "\u{1F4CB}": GiWhistle, // 📋
  "\u{1F9E7}": GiBlackBelt, // 🧧
};

export function WhyIcon({
  className,
  emoji,
}: {
  className?: string;
  emoji?: string | null;
}) {
  const key = emoji?.replaceAll("\u{FE0F}", "").trim() ?? "";
  const Icon = BY_EMOJI[key] ?? GiBoxingGlove;

  return <Icon aria-hidden className={className} />;
}
