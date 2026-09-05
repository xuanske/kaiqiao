import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KeypadKind } from "@/lib/math/types";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function Keypad({
  value,
  kind,
  disabled,
  onChange,
  onSubmit,
}: {
  value: string;
  kind: KeypadKind;
  disabled?: boolean;
  onChange: (next: string) => void;
  onSubmit: () => void;
}) {
  const press = (token: string) => {
    if (disabled) return;
    if (token === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (token === "." && value.includes(".")) return;
    if (token === "余" && value.includes("余")) return;
    if (value.length >= 10) return;
    onChange(value + token);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {DIGITS.map((d) => (
        <Key key={d} disabled={disabled} onClick={() => press(d)}>
          {d}
        </Key>
      ))}
      {kind === "dec" ? (
        <Key disabled={disabled} onClick={() => press(".")}>
          .
        </Key>
      ) : kind === "remainder" ? (
        <Key disabled={disabled} onClick={() => press("余")}>
          余
        </Key>
      ) : (
        <Key disabled={disabled} onClick={() => press("del")} aria-label="删除">
          <Delete className="size-5" />
        </Key>
      )}
      <Key disabled={disabled} onClick={() => press("0")}>
        0
      </Key>
      {kind === "int" ? (
        <Key variant="ok" disabled={disabled || !value} onClick={onSubmit}>
          确定
        </Key>
      ) : (
        <Key disabled={disabled} onClick={() => press("del")} aria-label="删除">
          <Delete className="size-5" />
        </Key>
      )}
      {kind !== "int" ? (
        <button
          type="button"
          disabled={disabled || !value}
          onClick={onSubmit}
          className="col-span-3 h-12 rounded-xl bg-ok text-base font-medium text-paper disabled:opacity-40"
        >
          确定
        </button>
      ) : null}
    </div>
  );
}

function Key({
  children,
  onClick,
  disabled,
  variant = "plain",
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "plain" | "ok";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center rounded-xl text-lg font-medium tabular-nums transition-[transform,background-color,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40",
        variant === "ok" ? "bg-ok text-paper" : "bg-secondary text-foreground",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
