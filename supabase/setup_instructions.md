# Supabaseセットアップ手順

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてサインイン
2. 「New project」をクリック
3. 以下の情報を入力：
   - **Name**: `ink-finder`
   - **Database Password**: 強力なパスワードを生成して保存
   - **Region**: `Northeast Asia (Tokyo)`
4. 「Create new project」をクリック

## 2. SQLの実行

Supabaseダッシュボードの「SQL Editor」から以下のSQLファイルを順番に実行：

### 実行順序：
1. `create_artists_table.sql` - テーブル作成
2. `rls_policies.sql` - セキュリティポリシー設定
3. `create_indexes.sql` - パフォーマンス最適化
4. `insert_sample_data.sql` - サンプルデータ挿入

## 3. API認証情報の取得

1. Supabaseダッシュボードの「Settings」→「API」へ移動
2. 以下の情報をコピー：
   - **Project URL** (例: `https://xxxxx.supabase.co`)
   - **anon public** key (例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 4. 環境変数の設定

`.env.local`ファイルを更新：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps API（後で設定）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 5. 動作確認

1. 開発サーバーを再起動：
   ```bash
   npm run dev
   ```

2. ブラウザで http://localhost:3000 にアクセス

3. Supabaseダッシュボードの「Table Editor」で`artists`テーブルを確認

## トラブルシューティング

### エラー: "relation "artists" does not exist"
→ SQLファイルが正しい順序で実行されているか確認

### エラー: "permission denied for table artists"
→ RLSポリシーが正しく設定されているか確認

### データが表示されない
→ 環境変数が正しく設定されているか確認
→ `.env.local`ファイルを変更後、開発サーバーを再起動

## セキュリティに関する注意

- `anon`キーは公開されても安全（RLSで保護）
- `service_role`キーは絶対に公開しない
- 本番環境では適切な認証システムを実装