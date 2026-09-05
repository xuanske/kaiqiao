import { cn } from "@/lib/utils";
import type { ColumnWork } from "@/lib/math/column";

export function ColumnMath({ work, wrong }: { work: ColumnWork; wrong?: boolean }) {
  return (
    <div
      className={cn(
        "mt-3 w-fit min-w-28 rounded-2xl bg-background/70 px-3 py-2 text-card-foreground",
        wrong && "ring-1 ring-destructive/40",
      )}
      aria-label="竖式"
    >
      <table className="ml-auto border-collapse font-mono">
        <tbody>
          {work.marks.some((c) => c !== " ") ? <Line cells={work.marks} ghost /> : null}
          <Line cells={work.digitsA} />
          <Line cells={work.digitsB} op={work.op} />
          <tr>
            <td colSpan={work.width + 1} className="border-t border-card-foreground/30 p-0 pt-1" />
          </tr>
          <Line cells={work.digitsR} strong />
        </tbody>
      </table>
    </div>
  );
}

function Line({
  cells,
  op,
  ghost,
  strong,
}: {
  cells: string[];
  op?: string;
  ghost?: boolean;
  strong?: boolean;
}) {
  return (
    <tr>
      <td
        className={cn(
          "w-5 px-0 text-center text-sm text-muted-foreground",
          ghost && "h-4 align-bottom text-xs text-lantern",
        )}
      >
        {op ?? ""}
      </td>
      {cells.map((ch, i) => (
        <td
          key={`${ch}-${i}`}
          className={cn(
            "w-5 px-0 text-center tabular-nums",
            ghost && "align-bottom text-xs text-lantern",
            strong && "font-display text-xl leading-7",
            !ghost && !strong && "font-display text-lg leading-6",
          )}
        >
          {ch === " " ? "" : ch}
        </td>
      ))}
    </tr>
  );
}
