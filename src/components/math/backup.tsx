import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/download";
import { exportBackup, importBackup, MAX_BACKUP_BYTES, type PersistShape } from "@/lib/math/save";
import { todayStamp } from "@/lib/math/progress";
import { useMath } from "@/store/math";

export function Backup() {
  const [pending, setPending] = useState<PersistShape | null>(null);
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState(false);
  const restore = useMath((s) => s.restore);
  const storageBlocked = useMath((s) => s.storageBlocked);
  const exportCurrent = () => {
    downloadText(`开窍-备份-${todayStamp()}.json`, exportBackup(useMath.getState()), "application/json;charset=utf-8");
    setMessage("已生成备份文件，请保存到文件或云盘。备份含答题与错题记录。");
  };
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setReading(true); setPending(null); setMessage("");
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("文件超过 1 MB，请选择开窍导出的 JSON 备份。");
      setPending(importBackup(await file.text()));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取失败，原有记录未改变。");
    } finally { setReading(false); }
  };
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4" aria-labelledby="backup-title">
      <h3 id="backup-title" className="text-lg">备份与恢复</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">进度保存在当前浏览器。换设备或清理浏览器前，先保存一份备份。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={exportCurrent}>导出备份</Button>
        <label className="flex min-h-10 cursor-pointer items-center rounded-xl bg-secondary px-3 text-sm">
          {reading ? "正在读取…" : "选择备份"}
          <input aria-label="选择备份文件" className="ml-2 w-40 text-xs" type="file" accept=".json,application/json" disabled={reading} onChange={(e) => void onFile(e)} />
        </label>
      </div>
      {pending ? (
        <div className="mt-3 rounded-xl bg-secondary p-3">
          <p className="text-sm">备份：{pending.selectedGrade} 年级 · 累计 {pending.stats.answered} 题 · {pending.wrong.length} 道错题</p>
          <p className="mt-2 text-xs leading-relaxed">恢复会替换本机所有年级的记录，不会合并。请先导出当前备份。{storageBlocked ? "原存档读取失败，导出的仅是当前练习数据。" : ""}</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => {
              if (restore(pending)) { setPending(null); setMessage("已恢复备份。"); }
              else setMessage("恢复失败，当前记录未改变。");
            }}>确认替换并恢复</Button>
            <Button variant="ghost" onClick={() => setPending(null)}>取消</Button>
          </div>
        </div>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground" role="status">{message}</p>
    </section>
  );
}
