/// <reference types="vite/client" />

/**
 * このアプリが読む環境変数。
 * どちらも未設定でよい——設定しなければ学習記録は端末内だけに保存され、
 * 今までとまったく同じ挙動になる（学級ポータルへ送らないだけ）。
 */
interface ImportMetaEnv {
  /** 学級ポータル(Supabase)のURL。例: https://xxxx.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /**
   * 学級ポータルの publishable key（sb_publishable_... で始まる公開前提のキー）。
   * secret key / service_role key は絶対に入れない。ここはクライアントに焼き込まれる。
   */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
