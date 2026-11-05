/**
 * 動画・画像などの大きな素材の置き場（2026-11-05）。
 *
 * 各アプリの public/ に入れると、直すたびのデプロイで同じ動画が丸ごと保存され、Vercel の Deployment Storage
 * （無料枠 10GB）を使いきる。素材は共通の置き場（リポジトリ onokomachi/learning-media ＝ learning-media-snowy.vercel.app）に
 * 1つだけ置き、ここから URL で読む。置き場のファイルは 上書きしない（新しい名前で足す。1年キャッシュのため）。
 */
export const MEDIA_BASE = 'https://learning-media-snowy.vercel.app';

/** 例: media('/videos/rengoku/idle.mp4') */
export const media = (path: string): string => `${MEDIA_BASE}${path}`;
