/**
 * 進捗データの保存先を抽象化するアダプタ。
 *
 * 保存の正本は今までどおり localStorage。学級ポータル(Supabase)へは、
 * 端末に書いたあとで非同期に送るだけ（learning-app-kit/sync）。したがって:
 *   - ネットが切れても学習は今までどおり続く。画面の動きは何も変わらない
 *   - ポータルが落ちていても、止まるのは「先生に届くこと」だけ
 *   - 環境変数を設定しなければ、従来と完全に同じ挙動になる
 *
 * 単元アプリごとに localStorage キーを一意にしている（suusei_*）ので、
 * 別単元のアプリからのデータ引きつぎは行わない。単元が変われば
 * モジュールID・スキルIDの体系ごと変わるため、引きついでも意味のある値にならない。
 *
 * VITE_SUPABASE_* は publishable key（公開前提のキー）。
 * secret key / service_role key は絶対にここへ置かない——クライアントに焼き込まれる。
 */
import type { StateStorage } from 'zustand/middleware';
import { createSyncedStorage } from 'learning-app-kit/sync';

/** カタログ(learning-app-kit/catalog)の app_id と一致させること。 */
const APP_ID = 'suusei';

const storage = createSyncedStorage({
  appId: APP_ID,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

/** 現在の保存先を返す。差し替えポイントはこの関数のみ。 */
export function getProgressStorage(): StateStorage {
  return storage;
}
