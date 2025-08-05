# セキュリティガイドライン

## 現在のセキュリティ対策

### ✅ 実装済み
- **データ保護**: 読み取り専用アクセス
- **XSS対策**: React自動エスケープ
- **HTTPS**: Vercel自動SSL
- **環境変数**: APIキー保護

### 🔐 Supabaseセキュリティ設定

1. **Row Level Security (RLS)**
   ```sql
   -- artists テーブルを読み取り専用に
   CREATE POLICY "Public artists are viewable by everyone" 
   ON artists FOR SELECT 
   USING (true);
   ```

2. **APIキーの使い分け**
   - `anon key`: 公開用（現在使用中）✅
   - `service key`: 管理用（使用しない）❌

### 🛡️ 追加推奨事項

1. **レート制限**
   - Vercel Edge Functionsでレート制限実装
   - Supabaseのレート制限設定

2. **CORS設定**
   - 特定ドメインのみアクセス許可

3. **監視**
   - Vercel Analyticsでトラフィック監視
   - 異常アクセスの検知

## デプロイ前チェック

- [ ] 環境変数が本番用に設定されている
- [ ] 管理画面へのアクセス制限
- [ ] robots.txtで管理ページを除外
- [ ] 不要なconsole.logを削除
- [ ] エラーメッセージに機密情報が含まれていない

## 緊急時の対応

1. **不正アクセスを検知した場合**
   - Supabaseダッシュボードでanon keyを再生成
   - Vercelで環境変数を更新

2. **大量アクセスの場合**
   - Vercelの自動スケーリングで対応
   - 必要に応じてレート制限を調整