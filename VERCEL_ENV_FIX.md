# Vercel環境変数の設定手順

## 問題
Admin画面でStylesタブのデータ更新が反映されない問題が発生しています。これは`SUPABASE_SERVICE_ROLE_KEY`環境変数が設定されていないことが原因です。

## 解決方法

### 1. Supabase Service Role Keyの取得

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクト「ink-finder」を選択
3. 左側メニューの「Settings」→「API」をクリック
4. 「Service role key」セクションの「Reveal」ボタンをクリックしてキーを表示
5. キーをコピー（`service_role` secret）

### 2. Vercelの環境変数設定

1. [Vercel Dashboard](https://vercel.com/)にログイン
2. プロジェクト「ink-finder」を選択
3. 「Settings」タブをクリック
4. 左側メニューの「Environment Variables」をクリック
5. 以下の環境変数を追加：

| Key | Value | Environment |
|-----|-------|-------------|
| SUPABASE_SERVICE_ROLE_KEY | （コピーしたService Role Key） | Production, Preview, Development |

### 3. デプロイの再実行

環境変数を追加した後、再デプロイが必要です：

```bash
vercel --prod
```

または、Vercel Dashboardから：
1. 「Deployments」タブを選択
2. 最新のデプロイメントの「...」メニューから「Redeploy」を選択

## 暫定的な対処法（localStorage利用）

上記の修正を適用するまでは、アプリケーションはlocalStorageをフォールバックとして使用します。これにより：

- StylesタブでのCRUD操作はブラウザのlocalStorageに保存されます
- データはブラウザごとに独立して保存されます
- ページをリロードしても変更は保持されます

## 確認方法

1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブでエラーメッセージを確認
3. 以下のログが表示されることを確認：
   - `Using localStorage fallback for style update` - localStorageフォールバックが動作している
   - `Style updated successfully via API` - APIルートが正常に動作している（環境変数設定後）

## セキュリティ注意事項

- Service Role Keyは管理者権限を持つため、絶対にクライアント側のコードには含めないでください
- 必ず環境変数として設定し、サーバーサイド（API Routes）でのみ使用してください