import { cn } from "@/lib/utils";

export type Mood = "idle" | "happy" | "sad" | "think";

/** Local vector artwork keeps the illustration crisp and available offline. */
export function Mascot({ mood = "idle", className }: { mood?: Mood; className?: string }) {
  return (
    <svg viewBox="0 0 160 168" className={cn("mascot", className)} aria-hidden="true">
      <ellipse cx="81" cy="151" rx="37" ry="7" fill="#173E31" opacity=".09" />
      <g className={mood === "idle" ? "lantern-float" : undefined}>
        <path d="M75 24c-2-10 5-17 14-16" fill="none" stroke="#325B44" strokeWidth="6" strokeLinecap="round" />
        <rect x="57" y="22" width="48" height="12" rx="6" fill="#35654B" />
        <path d="M30 81c0-32 20-50 50-50s51 18 51 50-20 52-51 52S30 113 30 81" fill="#F0C96D" />
        <path d="M80 34c-20 19-23 75-3 95M90 35c20 24 19 66 8 90" fill="none" stroke="#E3AE4A" strokeWidth="3" opacity=".55" />
        <path d="M46 53c5-7 10-10 15-12" fill="none" stroke="#FFF2CE" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="50" cy="92" rx="9" ry="5" fill="#E8A56C" opacity=".8" />
        <ellipse cx="110" cy="92" rx="9" ry="5" fill="#E8A56C" opacity=".8" />
        {mood === "happy" ? <g fill="none" stroke="#294737" strokeWidth="4.5" strokeLinecap="round"><path d="M56 79q6-9 12 0M93 79q6-9 12 0" /></g> : <g fill="#294737"><ellipse cx="62" cy="79" rx="4" ry="6" /><ellipse cx="99" cy="79" rx="4" ry="6" /></g>}
        {mood === "think" ? <circle cx="81" cy="95" r="4" fill="#294737" /> : <path d={mood === "sad" ? "M73 99q8-8 16 0" : "M73 95q8 9 16 0"} fill="none" stroke="#294737" strokeWidth="3.5" strokeLinecap="round" />}
        <rect x="67" y="128" width="27" height="8" rx="4" fill="#35654B" />
        <path d="M80 137v9m-5-6v7m10-7v7" stroke="#DFA84C" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g fill="#D7AA54"><path d="m24 36 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" /><path d="m136 105 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" /></g>
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return <svg viewBox="0 0 40 40" className={cn("size-10", className)} aria-hidden="true">
    <rect width="40" height="40" rx="13" fill="#285847" />
    <path d="M20 7v4" stroke="#F0C96D" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="15" y="9" width="10" height="3" rx="1.5" fill="#F9EAC5" />
    <rect x="10" y="12" width="20" height="20" rx="10" fill="#F0C96D" />
    <circle cx="16" cy="21" r="1.5" fill="#294737" /><circle cx="24" cy="21" r="1.5" fill="#294737" />
    <path d="M18 26q2 2 4 0M20 32v3" fill="none" stroke="#294737" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}
