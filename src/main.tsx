import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { adoptStudentFromUrl } from 'learning-app-kit/sync';
import App from './App.tsx';
import './index.css';

/**
 * ハブから来た場合、URLに載っている学級コード＋出席番号を受け取る。
 *
 * 単元アプリはハブと別ドメインなので localStorage を共有できない。
 * これを呼ばないと、ハブで名乗った子の記録が「どこかの端末の記録」のまま残り、
 * 先生の一覧に番号が出ない——画面上は正常に見えるので気づけない。
 *
 * await しない。名乗りの解決はネット越しなので、待つと起動が止まる。
 * 解決が終わった時点で kit が記録を送り直すので、順番を気にしなくてよい。
 */
void adoptStudentFromUrl({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
