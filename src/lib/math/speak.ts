function spoken(prompt: string): string {
  return prompt
    .replaceAll("□", "方框")
    .replaceAll("×", "乘")
    .replaceAll("÷", "除以")
    .replaceAll("−", "减")
    .replaceAll("-", "减")
    .replaceAll("+", "加")
    .replaceAll("=", "等于")
    .replaceAll("?", "")
    .replaceAll("？", "");
}

export function speakPrompt(prompt: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(spoken(prompt));
  utter.lang = "zh-CN";
  utter.rate = 0.92;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}

export function hushSpeak() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
