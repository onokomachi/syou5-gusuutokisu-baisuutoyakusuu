# 偶数と奇数・倍数と約数（syou5-gusuutokisu-baisuutoyakusuu）

学級ポータルの一部。種類: **math**／app_id: `suusei`。

## このアプリだけのこと
- 単元ごとの中身（問題の作り方・モジュール・本番テスト・実力の階段の段）は `src/lib/problems*`・`src/constants.ts`・
  `src/lib/testConfig.ts`・`src/lib/trialConfig.ts`・`src/components/modules/` にある。ここは自由に直してよい。
- おまかせモードの習熟度は「記録に残した skillId」で引く。レベルIDと記録の名前がちがうモジュールだけ `useAdaptive(ids, toSkillId)`。

## 確かめ方
- `npm run check`（型チェック・ビルド・このアプリの自動チェック・学級ポータルのルール点検）
- 共通ファイルを kit の版にそろえる: `npx learning-app-kit-platform fix`

<!-- platform:begin（learning-app-kit が配る。手で書きかえない。直すときは kit の platform/CLAUDE.common.md） -->
## 学級ポータル共通のルール（learning-app-kit が配る。ここは手で書きかえない）

このリポジトリは、複数のアプリがつながった1つの仕組み（学級ポータル）の一部です。
1つのアプリだけを見て直すと、ほかのアプリ・先生用画面（PRISM）・データベースとずれます。

- **構成**: `learning-app-kit`（共通部品・記録の送信・カタログ・実力の階段）／単元アプリ（算数・国語）／
  `class-portal-teacher`（PRISM・先生用）／`class-portal-kids`（子ども用ハブ）／Supabase `gakkyu-portal`／
  `onokomachi-master-DB`（知識集）。
- **始めと終わり**: 作業の前に kb スキルで関係する知見を引く。直したこと・分かったことは最後に kb save で残す。
- **共通ファイルは、このリポジトリで直さない。** どれが共通ファイルかは `npm run platform` が教える。
  直すときは learning-app-kit の `platform/families/<種類>/files/` を直して kit の版を上げ、
  各アプリで kit を上げてから `npx learning-app-kit-platform fix` で配る（1つのアプリだけ直すと、直しが届かない）。
- **記録の名前（skillId）はカタログの skill_id と同じ文字列にする。** レベルIDがすでに `compare-basic` なら、
  前に何かを足さない。問題・レベルを足したり名前を変えたりしたら、カタログを作り直して kit に入れる（portal-connect スキル）。
- **送る記録の形・データベースの表・PRISM の画面に関わる変更**は、関係するリポジトリを全部つないだセッションで行う。
  単体のセッションで気づいたら、直さずに PR とユーザーへの報告に「全体セッションで直すこと」として書く。
- **kit はコミットのSHAで固定している。** 上げるときは `npx learning-app-kit-platform update` → `npm run check`。
- **新しいアプリは、作りはじめに `npx learning-app-kit-platform init <種類>`**（math / kokugo / portal / standalone）。
  CLAUDE.md・共通ファイル・CI・build 前の点検がそろう。そのあと CLAUDE.md の上の段にアプリだけのことを書く。
- 子どもの氏名は扱わない（出席番号だけ）。APIキー・トークン・パスワードはファイルにも知識集にも書かない。
- **終わる前に `npm run check` を通す**（このルールの点検 `npm run platform` も入っている）。
- PR の本文に「ほかのアプリ・PRISM・データベースへの影響」を1行書く（無ければ「なし」）。
- 毎週月曜の朝、各アプリの CI が kit を最新に上げ、`npm run check` が通れば main に自動で反映する（Vercel が本番に出す。持ち主の操作は要らない）。
  失敗のメールが来たら（kit の変更でアプリが通らない／CI の設定が変わる更新）、全体セッションで直す。
  kit の変更は、全アプリに月曜の朝いっせいに届く。kit の PR では「ほかのアプリへの影響」を必ず書く。
- Vercel の build の前にもこの点検が走る（`prebuild`）。ずれたままでは本番に出ない。
<!-- platform:end -->
