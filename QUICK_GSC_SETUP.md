# Google Search Console クイック設定ガイド

## 🚀 3ステップで完了

### Step 1: 認証コードを取得
1. [Google Search Console](https://search.google.com/search-console)を開く
2. 「プロパティを追加」→ URLプレフィックス `https://inkfinder.jp`を入力
3. 「HTMLタグ」を選択してコードをコピー
   ```html
   <meta name="google-site-verification" content="ここの値をコピー" />
   ```

### Step 2: 環境変数に設定
`.env.local`ファイルの19行目を更新：
```env
# Before
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification-code

# After（例）
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=AbCdEfGhIjKlMnOpQrStUvWxYz123456
```

### Step 3: デプロイして確認
```bash
# ローカルで確認
npm run dev

# デプロイ（Vercelの場合）
git add .
git commit -m "Add Google Search Console verification"
git push

# Vercelの環境変数にも追加
# Vercel Dashboard → Settings → Environment Variables
# NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = 認証コード
```

## ✅ 確認方法
1. デプロイ完了後、Search Consoleで「確認」をクリック
2. 「所有権を証明しました」と表示されたら成功

## 📊 Google Analytics（オプション）
同様に`.env.local`の22行目を更新：
```env
# Before
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# After（例）
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABC123XYZ
```

## 🔍 設定後にやること
1. **サイトマップ送信**: Search Console → サイトマップ → `sitemap.xml`を追加
2. **インデックス登録**: URL検査 → トップページのURLを入力 → インデックス登録をリクエスト
3. **パフォーマンス確認**: 数日後から検索パフォーマンスデータが表示されます

## ⚠️ トラブルシューティング
- **認証失敗**: コードが完全にコピーされているか確認
- **環境変数が反映されない**: `npm run dev`を再起動
- **Vercelで動かない**: 環境変数をVercelダッシュボードにも設定

---
質問があれば[GitHub Issues](https://github.com/your-repo/ink-finder/issues)で聞いてください！