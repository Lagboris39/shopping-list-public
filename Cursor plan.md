# Cursor Plan — 買い物行くドン！ 引き継ぎドキュメント

他AIセッション向けの引き継ぎ用プラン。実装済み内容・現状の構成・次フェーズのタスクをまとめる。

---

## 実装済み（完了）

### バグ修正
- [x] Reorder中のIndexedDB連打を debounce（400ms）で修正 → UI停止解消
- [x] pointercancel 未対応を修正（長押しタイマーのキャンセル漏れ）
- [x] モーダル/ドロワーの exit アニメーション中にオーバーレイが pointer events をブロックし続けていた問題を修正（`pointerEvents: 'none'` を exit variants に追加）
- [x] **スワイプ中途半端停止の修正** — `animate` プロップではなく `springAnimate(x, target)` を `handleDragEnd` 内で直接呼び出すことで、指を離したとき常に 0 または限界位置へスナップするよう修正。`SwipeableItem`・`SwipeableHistoryItem` 両方に適用。
- [x] **スワイプ誤作動の修正（方向判定）** — `onPointerDown` でジェスチャーの方向を計測し、横成分が縦成分以上のときのみスワイプを開始するよう変更（`useDragControls` + `handleSwipePointerDown`）。縦スクロール中にスワイプが起動しなくなった。`dragDirectionLock` を廃止。
- [x] **`SwipeableHistoryItem` の閾値修正** — 判定条件を `offset.x < -30 || velocity.x < -100` から `offset.x < -50` に変更。

### 機能追加
- [x] **「どっちがお得？計算機」** — 右下固定FABから Bottom Sheet を表示。値段・内容量を入力すると単価を自動計算し、安い方のカードを緑ハイライト＋「✓ 安い！」バッジで強調表示。単位選択なし、商品名欄なし、シンプル設計。
- [x] **サジェスト機能の頻度ランキング** — `useMemo` で `history` の購入回数を集計し、頻度順にソートしてレコメンド表示。空のドロップダウン防止（`suggestions.length > 0` 条件追加）。
- [x] **履歴モーダルの「履歴に追加」UI改善** — 常時表示の入力欄を廃止し、「＋ 履歴に追加」ボタンをタップで展開する折りたたみ式に変更。追加完了後は自動で閉じる。
- [x] **履歴モーダルを閉じたとき「履歴に追加」フォームも閉じる** — `setShowHistory(false)` を呼ぶ箇所（オーバーレイクリック・✕ボタン）に `setShowDirectAdd(false)` を追加。
- [x] **拡大縮小ボタン（＋／－）** — 画面左下に浮動コントロールを追加。`zoom` CSS プロパティでリスト全体を 80〜150% の範囲でスケール変更。設定は `localStorage` に保存。
- [x] **iOS ホーム画面アプリの強制更新ボタン** — 設定ドロワーに「最新版に更新」ボタンを追加。タップで `?v=<timestamp>` を付けてリロードし、キャッシュを回避。
- [x] **初回チュートリアル自動表示を無効化** — `showTutorial` を `useState(false)` に変更。設定ドロワーからは引き続き手動で開ける。
- [x] **優先度星マーク** — カードに星ボタンを追加。星付きアイテムは ⭐ グループとしてリスト最上部に固定表示。IndexedDB に `starred: boolean` で保存。
- [x] **買い物リスト共有** — ヘッダーに共有ボタン。`navigator.share` または クリップボードコピーでテキスト共有。共有後に履歴移動確認シートを表示。
- [x] **絵文字の自動表示** — 品名キーワードに一致する標準絵文字を品名右に自動表示（約60種対応）。`emojiDict` + `getItemEmoji()` で実装。

### バグ修正・UX改善（追加）
- [x] **カード長押し時の文字選択を抑制** — `.item-main-area` に `user-select: none` / `-webkit-user-select: none` を追加。`onPointerDown` でも `e.preventDefault()` を呼ぶ。
- [x] **一括追加モーダルをキーボード対応全画面レイアウトに再設計** — `position: fixed; height: 100dvh` + `visualViewport` の `height`/`top` フォールバックで iOS/Android 両対応。textarea が `flex: 1` で伸縮し、追加ボタンが常にキーボード上部に表示される。`autoFocus` で開くと同時にキーボード起動。
- [x] **星マーク付きアイテムを登録順に並べる** — `starredItems` のソートを `order_index` 基準に変更。
- [x] **共有テキストに星マーク（★）を付与** — `formatShareText()` で星付きアイテムを先頭に移動し `★ ` プレフィックスを付加。
- [x] **カード長押し中の押し込みアニメーション** — `whileTap` をカード単体ではなく外側コンテナ（`.draggable-item-container:active { transform: scale(0.97) }`）に適用。コンテナ全体が縮むため `swipe-bg-danger` がはみ出さない。
- [x] **共有後の確認を中央ダイアログに変更** — `showShareConfirm` のモーダルをボトムシートから中央固定ダイアログ（外側 div でセンタリング ＋ 内側 motion.div でアニメーション）に変更。framer-motion の transform 競合を回避。
- [x] **星マーク機能 ON/OFF スイッチ** — `showStarFeature` state（`localStorage` 保存）を追加。設定ドロワー「カスタマイズ」に iOS 風トグルスイッチを追加。OFF 時は星ボタン・⭐グループを非表示。
- [x] **カテゴリ機能 ON/OFF スイッチ** — `showCategoryFeature` state（`localStorage` 保存）を追加。設定ドロワーに iOS 風トグルスイッチを追加。OFF 時は登録順フラット表示。
- [x] **ヘッダー共有ボタンをラベル付きに変更** — 丸アイコンボタンから「リストを共有」テキスト＋アイコンのピル型ボタンに変更。
- [x] **設定ボタンをギアアイコンに変更** — `PawPrint` → `Settings`（lucide-react）に変更。
- [x] **設定ドロワーのカテゴリ並び替えをトグル行スタイルに統一** — 全幅ボタンを廃止し、左ラベル＋右 `ChevronRight` の行形式に変更。

### UI改善
- [x] **アイテムカードの2行→1行化** — 数量ステッパーを横並び（－ N ＋）から縦3段（▲ / 数字 / ▼）に変更し横幅を削減。品名表示幅を大幅に確保。
- [x] **縦ステッパーのコンパクト化** — ▲▼ボタンを横長（36×14px）、数量文字を大きく（17px/800）、カードのpaddingを削減して縦幅を圧縮。
- [x] **カテゴリ色・テーマ** — ダークモード向けカテゴリ色を上書き定義。
- [x] **購入ボタン（✓）と数量＋ボタンの間隔調整** — `margin-left` を追加。
- [x] **「どっちがお得」入力ラベル改善** — 入力欄の上に「値段（円）」「内容量」ラベルを常時表示するよう変更（入力後も区別できる）。
- [x] **一括追加モーダルの自動キーボード起動を無効化** — `textarea` から `autoFocus` と `onFocus` の `scrollIntoView` 処理を削除。モーダルを開いただけではキーボードが出ない。
- [x] **カテゴリボタンを長押し方式に変更** — カテゴリアイコン・▼矢印を廃止。品名エリア長押し（600ms）でカテゴリ選択を起動。スワイプとの競合を方向判定で回避。
- [x] **履歴カードのカテゴリバッジ廃止・絵文字追加** — 履歴カードから色付き丸バッジを削除。品名右に絵文字を自動表示。
- [x] **カテゴリ選択画面のダークモード文字色修正** — `rgba(0,0,0,0.7)` → `var(--text-main)` に変更。
- [x] **共有テキストから絵文字・ヘッダーを除去** — `formatShareText` の出力をシンプルなテキスト（品名＋数量）のみに変更。一括追加インポート時に絵文字・ヘッダー行・`×N` 形式を正しく処理。

### デプロイ・PWA
- [x] **GitHub Pages デプロイ** — `vite.config.js` に `base: '/shopping-list-public/'` を追加、GitHub Actions ワークフロー（`.github/workflows/deploy.yml`）を作成。`main` ブランチ push で自動ビルド＆デプロイ。
  - 公開URL: `https://lagboris39.github.io/shopping-list-public/`
- [x] **PWAパス修正** — `manifest.json` の `start_url: "./"` + `scope: "/shopping-list-public/"` に修正、`index.html` のリソースパスを `%BASE_URL%` 形式に統一、`App.jsx` のアイコンパスを `import.meta.env.BASE_URL + 'icon.png'` に修正。

---

## 現在のコード構成（主要ファイル）

| ファイル | 内容 |
|---|---|
| `src/App.jsx` | 全UI・ロジック（約1300行）。`SwipeableItem` / `SwipeableHistoryItem` コンポーネント含む |
| `src/db.js` | IndexedDB操作。`items` / `history` / `learnedCategories` / `settings` の4ストア。`saveItems` に直列化キュー実装済み |
| `src/categoryDict.js` | 11カテゴリの辞書・色・アイコン・無視リスト定義 |
| `src/index.css` | CSS変数ベースのライト/ダークテーマ。モバイルファースト、最大幅500px |
| `public/manifest.json` | PWAマニフェスト（`start_url: "./"`, `scope: "/shopping-list-public/"` 設定済み）|
| `vite.config.js` | `base: '/shopping-list-public/'` 設定済み |
| `.github/workflows/deploy.yml` | GitHub Actions（node 20 + peaceiris/actions-gh-pages@v4）|

---

## 次フェーズのタスク（未実装・次セッションで着手）

優先度順に記載。

---

### 優先度: 低（旧タスク・将来対応）

#### 1. カスタムカテゴリの追加

設定ドロワーから新しいカテゴリを作成できる。カテゴリ名・アイコン（絵文字）・色をユーザーが指定。IndexedDB の `customCategories` ストアに保存。

#### 2. 買い物リスト画面でのカテゴリ並び替え

設定ドロワーだけでなく、リスト画面上でもカテゴリ順をドラッグで並び替えできるようにする。

#### 3. インタラクティブ・チュートリアル

現在のテキストモーダルを、ジェスチャーをアニメーションで実演するカード形式に置き換える。設定ドロワーの「使い方を見る」からのみ開く。

#### 4. モネタイズ・サービス継続

Google AdSense などの広告掲載、Service Worker によるオフライン対応強化。

---

## 技術メモ

- **IndexedDB 保存パターン**: `reorderSaveTimeoutRef` で debounce（400ms）。ドラッグ中は state のみ更新し、停止後に1回だけ保存する設計。
- **アニメーション**: `framer-motion` の `Reorder.Group` + `Reorder.Item`。`AnimatePresence` と組み合わせる場合は exit アニメーションが pointer events をブロックしないよう `variants` の `exit` に `pointerEvents: 'none'` が必須。
- **テーマ**: `body[data-theme='dark/light/system']` で切り替え。CSS変数（`--bg`, `--card-bg`, `--text-main` 等）がベース。
- **スマホ入力**: 数値入力は `type="text" inputMode="decimal" pattern="[0-9.]*"` を使用（スピナー非表示）。
- **デプロイ**: `main` ブランチ push → GitHub Actions が `npm run build` → `gh-pages` ブランチに自動公開。
- **スワイプ実装パターン**: `SwipeableItem` / `SwipeableHistoryItem` ともに `useDragControls` を2つ持つ（`dragControls` = 長押しリオーダー用、`swipeDragControls` = 横スワイプ用）。`onPointerDown` で指の動き方向を 8px 計測し、横方向のみ `swipeDragControls.start(event)` を呼び出す。スナップは `springAnimate(x, target, spring)` で直接制御（`animate` プロップは使わない）。`SwipeableItem` のスワイプ制限は `-60px`、確定閾値は `-48px`。
- **拡大縮小**: `listZoom` state を `zoom` CSS プロパティとして `list-container` に適用。範囲は 0.8〜1.5。`localStorage` に保存。
- **星マーク**: `items` の各要素に `starred: boolean` フィールド。リスト表示時に `starredItems` / `nonStarredItems` に分離してレンダリング。星グループは `Reorder.Group` で並び替え可能。
- **カテゴリ変更**: カードの品名エリア（`item-main-area`）を長押し（600ms）で起動。指が 8px 以上動いたらキャンセル。`user-select: none` + `e.preventDefault()` でテキスト選択を抑制済み。
- **共有**: `formatShareText()` は星付きアイテムを先頭に並べ `★ ` を付与、以降は品名＋数量のテキスト形式。`navigator.share` 非対応時はクリップボードコピー。共有後に中央ダイアログで履歴移動確認。
- **機能トグル**: `showStarFeature` / `showCategoryFeature` state。`localStorage` に保存。設定ドロワー「カスタマイズ」セクションの `ToggleSwitch` コンポーネント（インライン実装の iOS 風スライドトグル）で切り替え。
- **一括追加モーダル**: `position: fixed; top: 0; left: 0; right: 0; height: 100dvh` の全画面フレックスレイアウト。`autoFocus` で開くと同時にキーボード起動。`importContainerRef` + `visualViewport` の `resize`/`scroll` イベントで `height` と `top` を動的調整（iOS フォールバック）。ボタン下部に `env(safe-area-inset-bottom)` でホームバー対応。
- **カード長押しアニメーション**: `motion.div.item-card` の `whileTap` を廃止。外側コンテナ `.draggable-item-container:active { transform: scale(0.97) }` でコンテナ全体をスケールし、`swipe-bg-danger` のはみ出しを防止。
- **共有確認ダイアログ**: センタリング専用の外側 `div`（`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%)`）＋ アニメーション専用の内側 `motion.div` の2層構造。framer-motion の transform と CSS transform の競合を回避。
