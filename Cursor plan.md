## 目的

`shopping-list-public`（ローカルPWA）の **「操作後にUIが反応しなくなる／止まったように見える」不具合** を、現状コードの構造から最短で潰すための、他AI向け引き継ぎ用プラン。

---

## 現状の前提（貼り付けプランとの整合）

貼り付けてもらった「一般公開向けローカルPWA化」計画の主要部分は、現状コードに **概ね反映済み** に見える。

- **通信排除**: API/pollingなし（ローカル完結）
- **永続化**: IndexedDB（`idb`）で `items/history/learnedCategories/settings`
- **1画面統合**: 入力欄＋「一括追加」「履歴」＋履歴モーダル（直追加＋日付）＋数量ステッパー＋カテゴリ変更モーダル
- **カテゴリ辞書＋自己学習**: `categoryDict`＋`learnedCategories`（IndexedDB）
- **設定/ヘルプ**: 設定ドロワー、テーマ、チュートリアル、カテゴリ順カスタム

---

## UI停止の原因候補（優先度順）

### 1) （最有力）並び替え中に IndexedDB へ「全件保存」を連打している

- 対象: `src/App.jsx` の `Reorder.Group onReorder` → `handleReorder()` → `saveItems()`
- 事象: `onReorder` はドラッグ中に高頻度で発火しうるのに、`handleReorder` が `await saveItems(updatedItems)` を行う。
- `src/db.js` の `saveItems(items)` は毎回 `clear()` → 全件 `put()` のため重い。
- `handleReorder` は `async` だが呼び出し側が `await` していないため、ドラッグ中に「未完了の保存」が積み上がり、メインスレッドが詰まって UI が止まったように見える可能性が高い。

### 2) Reorder.Group の直下に AnimatePresence を挟んでいる（相性問題）

- 対象: `src/App.jsx` のメインリスト（カテゴリごとの `Reorder.Group`）
- 構造: `Reorder.Group` → `AnimatePresence` → `SwipeableItem(内部で Reorder.Item)`
- `AnimatePresence` は exit 中にDOMを保持するため、Reorder のレイアウト計算とDOMのタイミングがズレて不安定化し、停止/固まりの引き金になりうる。

### 3) （補助）カテゴリ順カスタムでもドラッグ中に保存を連打している

- 対象: `src/App.jsx` のカテゴリ並び替えモーダル `Reorder.Group` の `onReorder` 内で `await saveSetting(...)`
- 件数が少ないので影響は小さめだが、同じパターン（ドラッグ中に永続化連打）を抱える。

### 4) （補助）ドラッグ開始タイマーが pointercancel を考慮していない

- 対象: `src/App.jsx` のドラッグハンドル `onPointerDown`
- タッチ環境で `pointercancel` が起きたときにタイマーが残ると、意図しない drag 開始や競合が起きうる。

---

## 修正方針（何をどう直すか）

### Fix A（最優先）Reorder中は IndexedDB 保存しない（保存は最後の1回だけ）

- **方針**:
  - `onReorder` は **state更新だけ**（永続化しない）
  - 永続化は次のいずれかで **最後の1回だけ**
    - ドラッグ終了（pointerup/drag end）タイミング
    - debounce（例: 300–500ms 無操作後）
  - すでに保存実行中なら
    - 「最後の状態だけ保存」へ上書き（キュー/直列化/キャンセル可能な仕組み）
- **狙い**: UI停止の本命を外す（I/Oと同期的負荷をドラッグ操作から切り離す）

### Fix B（優先）メインリストの Reorder.Group 直下から AnimatePresence を外す

- **方針**:
  - `Reorder.Group` の直下は `Reorder.Item` だけ（＝`SwipeableItem` 内の `Reorder.Item` だけ）に寄せる
- **狙い**: Reorder の内部計算とDOMの整合を取り、固まり要因を減らす

### Fix C（必要なら）saveItems を軽くする

- **最小変更**: Fix A/B の後でも重い場合のみ
- **選択肢**:
  - 書き込みの直列化（write-lock）で transaction の多重発行を防止
  - データモデル変更（items全体を1レコード化）※影響大

### Fix D（任意）pointercancel 対応

- **方針**: `pointerup` と同様に `pointercancel` でも長押しタイマーを解除

---

## 実施順（推奨）

```mermaid
flowchart LR
  reproduce[再現条件の切り分け] --> fixA[Fix_A:Reorder中は保存しない]
  fixA --> verify1[停止/固まりが消えたか確認]
  verify1 --> fixB[Fix_B:AnimatePresenceを外す]
  fixB --> verify2[再確認]
  verify2 --> fixC[Fix_C:saveItems最適化(必要なら)]
  verify2 --> fixD[Fix_D:pointercancel対応(任意)]
```

---

## 確認観点（最低限）

- 並び替えを何度も繰り返しても UI が固まらない
- 並び替え直後に「購入（チェック）」「スワイプ削除」「数量±」「カテゴリ変更」を連打しても固まらない
- 履歴モーダルの検索・日付指定追加・再登録を行っても固まらない

---

## 未実装（全体計画に含まれるが、UI停止バグ修正とは別フェーズ）

ここから先は「バグ修正が落ち着いた後」に着手する想定。UI停止の原因切り分け中は混ぜない（同時に入れると原因が追いにくくなる）。

- **「どっちがお得？計算機」**（単価比較機能）
  - 方針案: 右下ボタンから Bottom Sheet を `AnimatePresence` で表示し、入力（価格・内容量）から \(100g\) / \(100ml\) あたり等を算出して比較表示。
  - 注意: メインの `Reorder.Group` とは独立したモーダルとして実装し、Reorder配下には入れない。
- **共有機能**（URL共有等）の検討
  - 方針案: Web Share API（対応端末）＋フォールバック（URLコピー）など。
  - データの共有形態（URLに埋める/短縮/クラウドに置く/ローカルのみ）を先に決める必要あり。
- **オフライン対応（PWA ServiceWorker）の微調整**
  - 方針案: 既存のSW/manifest構成を確認し、キャッシュ戦略（静的資産＋アイコン等）を整理。
  - 注意: UI停止調査中にSWを触ると「キャッシュが古くて挙動が変」になりやすいので、バグ修正後に実施。

---

## 追加：全体計画に含まれていたが、現状コードでは未実装（または未着手）に見える項目

上の3点に加えて、貼り付け計画内にあり、現状の `shopping-list-public` では **まだ実装されていない可能性が高い** ものを明示する（他AIが「どこまで終わっているか」を誤解しないため）。

- **マネタイズ設定枠（設定画面）**
  - 目的: Stripe Payment Links への導線＋自己申告「応援しました！」→ `settings.isPremium=true` を保存し、テーマカラー/フォント等をアンロック。
  - 現状: 設定ドロワーはあるが、Stripeリンクや `isPremium` の保存・分岐が見当たらない。
  - 進め方（案）:
    - まず `settings` ストアに `isPremium`（boolean）を追加して読み書き（既存の `getSetting/saveSetting` を流用）。
    - 設定ドロワーに「応援リンク」＋「応援しました！」ボタンを追加。
    - `isPremium` に応じて「テーマカラー/フォント」設定UIを表示（非premiumは非表示/ロック表示）。

- **公開準備（ビルドとデプロイ手順の固定化）**
  - 目的: Viteビルド成果物を Vercel/Netlify/GitHub Pages のどれかへデプロイし、一般公開（アクセスだけで使える・ホーム追加でPWA）を成立させる。
  - 現状: デプロイ先の選定・手順書（例: `README.md`）がプロジェクト内に見当たらない。
  - 進め方（案）:
    - デプロイ先を決める（Vercel/Netlify/Pages）。
    - `README.md` に「build/preview」「PWA確認手順（iOS/Android）」「更新時のキャッシュ対策」を明記。

- **共有機能の仕様決め（実装前の必須タスク）**
  - 共有の“中身”を先に決めないと実装がブレる。
  - 候補:
    - **テキスト共有**（買い物リストを整形して共有）: すぐ実装可能、プライバシー安全。
    - **URL共有（状態をURLへエンコード）**: 便利だが長くなりがち、復元ロジックが必要。
    - **URL共有（クラウドに保存して短いURL）**: バックエンド復活が必要（当初方針と衝突しやすい）。


