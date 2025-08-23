# Google Search Console 認証ガイド

## 🚨 現在の状況
サイトがまだデプロイされていないため、HTMLファイル認証が失敗しています。

## ✅ 解決方法

### オプション1: サイトをデプロイしてから認証（推奨）

1. **Vercelにデプロイ**
   ```bash
   # Vercel CLIをインストール（まだの場合）
   npm i -g vercel
   
   # デプロイ
   vercel
   
   # 質問に答える：
   # - Set up and deploy? → y
   # - Which scope? → あなたのアカウントを選択
   # - Link to existing project? → n（新規の場合）
   # - Project name? → ink-finder
   # - In which directory? → ./
   # - Override settings? → n
   ```

2. **デプロイ完了後のURL確認**
   - Vercelが生成するURL（例: `https://ink-finder-xxx.vercel.app`）
   - カスタムドメイン設定済みの場合: `https://inkfinder.jp`

3. **Google Search Consoleで再認証**
   - 正しいURLでプロパティを追加
   - HTMLファイル認証またはメタタグ認証を選択

### オプション2: メタタグ認証を使用（デプロイ前でも設定可能）

1. **Google Search Consoleで新しいプロパティを追加**
   - URLプレフィックス: デプロイ予定のURL
   - 例: `https://ink-finder.vercel.app` または `https://inkfinder.jp`

2. **HTMLタグ認証を選択**
   ```html
   <meta name="google-site-verification" content="4037780cae863123" />
   ```

3. **すでに設定済み**
   - `src/app/layout.tsx` の87行目
   - `.env.local` の19行目

### オプション3: ローカル開発環境での一時的な確認

現在、認証ファイルは正しく配置されています：
- ファイル: `/public/google4037780cae863123.html`
- アクセス可能: `http://localhost:3000/google4037780cae863123.html`

## 📋 デプロイ前チェックリスト

- [x] 認証ファイル作成済み: `public/google4037780cae863123.html`
- [x] メタタグ設定済み: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=4037780cae863123`
- [x] vercel.json設定済み
- [ ] Vercelにデプロイ
- [ ] カスタムドメイン設定（オプション）
- [ ] Google Search Consoleで認証

## 🚀 Vercelデプロイ手順

### 初回デプロイ
```bash
# GitHubにプッシュ
git add .
git commit -m "Add Google Search Console verification"
git push origin main

# Vercel CLIでデプロイ
vercel --prod
```

### 環境変数の設定（Vercelダッシュボード）
1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. Settings → Environment Variables
4. 追加:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = 4037780cae863123
   NEXT_PUBLIC_SUPABASE_URL = [your-supabase-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-supabase-anon-key]
   ```

## 📝 デプロイ後の確認

1. **認証ファイルアクセス確認**
   ```bash
   curl https://your-deployed-url.vercel.app/google4037780cae863123.html
   ```

2. **メタタグ確認**
   - ブラウザでサイトを開く
   - 開発者ツール → Elements
   - `<meta name="google-site-verification"` を検索

3. **Google Search Consoleで認証**
   - 正しいURLでプロパティを追加
   - 「確認」をクリック

## ⚠️ よくある問題

### "Could not find your site"エラー
- **原因**: サイトがまだデプロイされていない、またはURLが間違っている
- **解決**: デプロイ完了後、正しいURLで再試行

### 認証ファイルが404
- **原因**: publicフォルダの設定ミス
- **解決**: ファイルが`public/`フォルダにあることを確認

### メタタグが見つからない
- **原因**: 環境変数が設定されていない
- **解決**: Vercelの環境変数を確認

## 📞 サポート

問題が解決しない場合：
1. デプロイログを確認
2. Vercelのビルドログを確認
3. Google Search Consoleのヘルプセンターを参照