# INK FINDER - デプロイメントガイド

## 本番環境へのデプロイ手順

### 1. 事前準備チェックリスト

- [ ] 環境変数の準備（Supabase URLとキー）
- [ ] データベースの本番環境準備
- [ ] 画像の最適化
- [ ] SEO設定の確認

### 2. Vercel でのデプロイ（推奨）

#### ステップ 1: GitHub にプッシュ
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

#### ステップ 2: Vercel でプロジェクト作成
1. https://vercel.com にアクセス
2. "New Project" をクリック
3. GitHubリポジトリをインポート
4. 環境変数を設定
5. Deploy!

### 3. 環境変数の設定

本番環境で必要な環境変数：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

### 4. カスタムドメインの設定

1. Vercelのプロジェクト設定へ
2. "Domains" タブ
3. カスタムドメインを追加
4. DNSレコードを設定

### 5. 本番環境の確認事項

- [ ] 全ページが正常に表示される
- [ ] 画像が正しく読み込まれる
- [ ] フィルター機能が動作する
- [ ] モバイル表示が適切
- [ ] 言語切り替えが機能する

### 6. パフォーマンス最適化

- 画像の遅延読み込み ✅
- コンポーネントのメモ化 ✅
- 適切なキャッシュ設定

### 7. SEO対策

- メタタグの設定
- OGP画像の準備
- robots.txtの設定
- サイトマップの生成

## トラブルシューティング

### ビルドエラーが発生した場合
```bash
npm run build
```
でローカルでビルドを確認

### 環境変数が読み込まれない場合
- Vercelの環境変数設定を確認
- `NEXT_PUBLIC_` プレフィックスを確認

## その他のデプロイオプション

### Netlify
- GitHub連携で自動デプロイ
- 環境変数の設定が必要

### AWS Amplify
- AWSアカウントが必要
- より細かい制御が可能

### Self-hosted (VPS)
- Node.js環境の準備
- PM2でプロセス管理
- Nginxでリバースプロキシ