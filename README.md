# Ink Finder

タトゥーアーティストを検索・発見できるWebアプリケーション

## セットアップ手順

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセスしてアカウントを作成
2. 「New project」をクリック
3. 以下の情報を入力：
   - **Organization**: 既存の組織を選択または新規作成
   - **Project name**: `ink-finder`
   - **Database Password**: 強力なパスワードを生成（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)`
4. 「Create new project」をクリック（プロジェクト作成に1-2分かかります）

### 2. データベースのセットアップ

プロジェクトが作成されたら：

1. Supabaseダッシュボードの左メニューから「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLファイルの内容を順番にコピー＆ペーストして実行：
   - `/supabase/create_artists_table.sql`
   - `/supabase/rls_policies.sql`
   - `/supabase/create_indexes.sql`
   - `/supabase/insert_sample_data.sql`

各SQLを実行する際は、エディタに貼り付けて「Run」ボタンをクリック

### 3. API認証情報の取得

1. Supabaseダッシュボードの左メニューから「Settings」をクリック
2. 「API」セクションをクリック
3. 以下の情報をコピー：
   - **Project URL**: `https://xxxxx.supabase.co`の形式
   - **anon public** key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`で始まる長い文字列

### 4. 環境変数の設定

`.env.local`ファイルを開き、コピーした値で更新：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanon_public_key

# Google Maps API（後で設定）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 5. アプリケーションの起動

1. 開発サーバーを再起動（Ctrl+Cで停止してから）：
   ```bash
   npm run dev
   ```

2. ブラウザで http://localhost:3000 にアクセス

### トラブルシューティング

#### "Invalid URL"エラーが表示される場合
- `.env.local`のURLが正しくコピーされているか確認
- URLの最後に余分な`/`が入っていないか確認
- 環境変数を変更後、必ず開発サーバーを再起動

#### データが表示されない場合
- Supabaseダッシュボードの「Table Editor」で`artists`テーブルにデータが入っているか確認
- ブラウザの開発者ツールでネットワークエラーを確認

## 機能

- 🔍 アーティスト検索（名前、スタイル、キーワード）
- 🎨 スタイルフィルター（複数選択可）
- 💰 価格帯フィルター
- 📍 地域フィルター
- 👁️ ビューカウント自動更新
- 📱 レスポンシブデザイン

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase（PostgreSQL）
- Lucide React Icons