# Cursor Plan — 買い物行くドン！ 引き継ぎドキュメント

他AIセッション向けの引き継ぎ用プラン。実装済み内容・現状の構成・次フェーズのタスクをまとめる。

---

## 実装済み（完了）

### バグ修正
- [x] Reorder中のIndexedDB連打を debounce（400ms）で修正 → UI停止解消
- [x] pointercancel 未対応を修正（長押しタイマーのキャンセル漏れ）
- [x] モーダル/ドロワーの exit アニメーション中にオーバーレイが pointer events をブロックし続けていた問題を修正（`pointerEvents: 'none'` を exit variants に追加）

### 機能追加
- [x] **「どっちがお得？計算機」** — 右下固定FABから Bottom Sheet を表示。値段・内容量を入力すると単価を自動計算し、安い方のカードを緑ハイライト＋「✓ 安い！」バッジで強調表示。単位選択なし、商品名欄なし、シンプル設計。
- [x] **サジェスト機能の頻度ランキング** — `useMemo` で `history` の購入回数を集計し、頻度順にソートしてレコメンド表示。空のドロップダウン防止（`suggestions.length > 0` 条件追加）。
- [x] **履歴モーダルの「履歴に追加」UI改善** — 常時表示の入力欄を廃止し、「＋ 履歴に追加」ボタンをタップで展開する折りたたみ式に変更。追加完了後は自動で閉じる。

### UI改善
- [x] **アイテムカードの2行→1行化** — 数量ステッパーを横並び（－ N ＋）から縦3段（▲ / 数字 / ▼）に変更し横幅を削減。品名表示幅を大幅に確保。
- [x] **縦ステッパーのコンパクト化** — ▲▼ボタンを横長（36×14px）、数量文字を大きく（17px/800）、カードのpaddingを削減して縦幅を圧縮。
- [x] **カテゴリ色・テーマ** — ダークモード向けカテゴリ色を上書き定義。
- [x] **購入ボタン（✓）と数量＋ボタンの間隔調整** — `margin-left` を追加。

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

### 1. スワイプ挙動の改善（優先度: 高）

**現状の問題:**
- 左スワイプで削除ボタンが露出し、スワイプを離した瞬間にそのまま保持される場合がある
- ユーザーの意図しないタイミングで削除ボタンが露出したまま残りやすい

**方針:**
- 左限界（`dragConstraints.left = -70`）まで到達した場合のみ `isRevealed = true` で保持
- それ以外（途中で離した場合）は必ず `isRevealed = false` に戻す
- 現在の判定条件 `info.offset.x < -30 || info.velocity.x < -100` を見直し、**速度ではなく到達位置**を優先基準にする
- 実装箇所: `src/App.jsx` の `SwipeableItem` 内 `handleDragEnd` 関数（`dragConstraints={{ left: -70, right: 0 }}`）

```js
// 修正方針
const handleDragEnd = (event, info) => {
  // 左限界付近（-60px以上）まで到達した場合のみ保持
  if (info.offset.x < -60) {
    setIsRevealed(true);
  } else {
    setIsRevealed(false);
  }
};
```

---

### 2. 買い物リストの共有機能（優先度: 高）

**仕様:**

#### 送信側の操作
1. ヘッダー or 設定ドロワーに「共有」ボタンを追加
2. タップするとリストをテキスト整形して表示（例）:
   ```
   【買い物リスト】
   🥦 ブロッコリー
   🥛 牛乳 ×2
   🍎 りんご
   ```
3. Web Share API（`navigator.share`）でLINE等に送信。非対応端末はクリップボードコピーにフォールバック
4. 共有後、「リストを履歴に移動しますか？」確認ダイアログを表示
   - 「移動する」→ 全アイテムを今日の日付で履歴に追加し、リストをクリア
   - 「このまま残す」→ 何もしない

#### 受信側の操作
- 受け取ったテキストを「一括追加」の入力欄に貼り付けることで登録できる（既存機能で対応可能）
- ※ URL共有（クリック1つで登録）はバックエンドが必要なため今回は不採用

**実装箇所:**
- `src/App.jsx` のヘッダー右ボタン列に共有ボタン（`Share2` アイコン）を追加
- 共有テキスト整形関数 `formatShareText(items)` を追加
- 確認ダイアログは既存の `bottomSheetVariants` + `AnimatePresence` パターンで実装
- `navigator.share` 非対応時は `navigator.clipboard.writeText` にフォールバック

---

### 3. 初回チュートリアルを無効化（優先度: 低）

**現状:** アプリ初回起動時にチュートリアルモーダルが全画面表示される（`localStorage.getItem('hasSeenTutorial')` で制御）

**方針:** チュートリアル自体は削除せず、初回自動表示だけを無効化する。

```js
// src/App.jsx
// Before
const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('hasSeenTutorial'));

// After（常にfalseで初期化 → 自動表示しない）
const [showTutorial, setShowTutorial] = useState(false);
```

設定ドロワーの「アプリの使い方を見る」ボタンからは引き続き手動で開けるので機能は残す。

---

## 技術メモ

- **IndexedDB 保存パターン**: `reorderSaveTimeoutRef` で debounce（400ms）。ドラッグ中は state のみ更新し、停止後に1回だけ保存する設計。
- **アニメーション**: `framer-motion` の `Reorder.Group` + `Reorder.Item`。`AnimatePresence` と組み合わせる場合は exit アニメーションが pointer events をブロックしないよう `variants` の `exit` に `pointerEvents: 'none'` が必須。
- **テーマ**: `body[data-theme='dark/light/system']` で切り替え。CSS変数（`--bg`, `--card-bg`, `--text-main` 等）がベース。
- **スマホ入力**: 数値入力は `type="text" inputMode="decimal" pattern="[0-9.]*"` を使用（スピナー非表示）。
- **デプロイ**: `main` ブランチ push → GitHub Actions が `npm run build` → `gh-pages` ブランチに自動公開。
