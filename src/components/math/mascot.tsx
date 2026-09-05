import { cn } from "@/lib/utils";

export type Mood = "idle" | "happy" | "sad" | "think";

export function Mascot({ mood = "idle", className }: { mood?: Mood; className?: string }) {
  return (
    <div className={cn("relative mx-auto h-32 w-24", className)} aria-hidden>
      <div className={cn("flex h-full flex-col items-center pt-1", mood === "idle" && "kai-bob")}>
        <div className="size-2.5 rounded-full bg-lantern" />
        <div className="-mt-0.5 h-2 w-8 rounded-t-full bg-lantern" />
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-lantern shadow-[0_10px_22px_-10px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-3">
            <Eye mood={mood} />
            <Eye mood={mood} />
          </div>
          <Mouth mood={mood} />
        </div>
        <div className="h-5 w-1 rounded-full bg-accent" />
        <div className="-mt-1 size-2 rounded-full bg-accent" />
      </div>
    </div>
  );
}

function Eye({ mood }: { mood: Mood }) {
  if (mood === "happy") return <span className="h-1 w-2.5 rounded-full bg-ink" />;
  return <span className="size-2 rounded-full bg-ink" />;
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === "happy") {
    return <div className="mt-2 h-2 w-6 rounded-b-full border-b-2 border-ink" />;
  }
  if (mood === "sad") {
    return <div className="mt-3 h-2 w-5 rounded-t-full border-t-2 border-ink" />;
  }
  if (mood === "think") {
    return <div className="mt-2.5 size-1.5 rounded-full bg-ink" />;
  }
  return <div className="mt-2.5 h-1 w-4 rounded-full bg-ink/80" />;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-lantern" />
      <rect x="13" y="4" width="6" height="3" rx="1.5" className="fill-ink" />
      <rect x="8" y="8" width="16" height="16" rx="8" className="fill-paper" />
      <circle cx="12.5" cy="15" r="1.4" className="fill-ink" />
      <circle cx="19.5" cy="15" r="1.4" className="fill-ink" />
      <rect x="15" y="24" width="2" height="4" rx="1" className="fill-accent" />
    </svg>
  );
}
