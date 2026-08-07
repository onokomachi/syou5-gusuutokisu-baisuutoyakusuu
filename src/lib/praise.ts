/**
 * プロセス称賛＆ノーマライズ表現（成長マインドセット, エビII）。
 * 能力ではなく「やり方・努力・粘り」をほめる。失敗は学びの一部として正常化する。
 */
const PERFECT = ['いい やり方だったね！', 'さいごまで ていねいに できたね！', 'よく 考えられたね！', 'あきらめずに できたね！'];
const DONE = ['できたね！その ちょうしだよ。', 'なおして できたね、えらい！', 'がんばって 正かいまで たどりついたね！'];
const ENCOURAGE = ['だいじょうぶ、まちがいは 学びの たね。', 'まちがいは 脳が 育つ サインだよ。', 'もう少し！ ゆっくりで いいよ。'];

function pick(a: string[]) { return a[Math.floor(Math.random() * a.length)]; }

export function praiseClear(perfect: boolean): string {
  return perfect ? pick(PERFECT) : pick(DONE);
}
export function encourage(): string {
  return pick(ENCOURAGE);
}
