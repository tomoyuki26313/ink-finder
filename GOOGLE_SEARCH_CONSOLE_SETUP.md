# Google Search Console設定ガイド

## 1. 認証コードの取得

1. [Google Search Console](https://search.google.com/search-console)にアクセス
2. 「プロパティを追加」をクリック
3. ドメインプロパティ「inkfinder.jp」を入力
4. HTMLタグ認証を選択
5. 表示される認証コードをコピー

## 2. 認証コードの設定

`src/app/layout.tsx`の86-88行目を更新：

```typescript
// Before
verification: {
  google: 'your-google-verification-code',
},

// After (例)
verification: {
  google: 'ABC123XYZ456...',  // 実際の認証コード
},
```

## 3. デプロイと確認

1. 変更をコミット・デプロイ
2. Google Search Consoleで「確認」をクリック
3. 所有権が確認されたら完了

## 4. 初期設定（認証後）

### サイトマップの送信
1. Search Console > サイトマップ
2. `https://inkfinder.jp/sitemap.xml`を追加
3. 送信

### インデックス登録のリクエスト
1. URL検査ツールを使用
2. 重要なページのURLを入力
3. 「インデックス登録をリクエスト」

### 検索パフォーマンスの確認
- クリック数、表示回数、CTR、平均掲載順位を監視
- 検索クエリを分析してコンテンツ戦略を調整

## 5. 追加の認証方法（オプション）

### DNSレコード認証（ドメイン全体）
```
TXT @ google-site-verification=認証コード
```

### Google Analytics認証
- Google Analyticsの管理者権限がある場合、自動認証可能

### Google Tag Manager認証
- GTMコンテナがインストールされている場合、認証可能

## 6. 環境変数での管理（推奨）

`.env.local`ファイル：
```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=実際の認証コード
```

`src/app/layout.tsx`：
```typescript
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
},
```

## 7. 確認事項チェックリスト

- [ ] 認証コードを正しく設定
- [ ] デプロイ完了
- [ ] Search Consoleで所有権確認
- [ ] サイトマップ送信
- [ ] robots.txtの確認
- [ ] 主要ページのインデックス登録リクエスト

## トラブルシューティング

### 認証が失敗する場合
1. 認証コードが正しくコピーされているか確認
2. デプロイが完了しているか確認
3. HTTPSでアクセスできるか確認
4. キャッシュをクリアして再試行

### インデックスされない場合
1. robots.txtでブロックされていないか確認
2. noindexタグが設定されていないか確認
3. サイトマップが正しく生成されているか確認
4. ページの品質とコンテンツを改善

## 参考リンク
- [Search Console ヘルプ](https://support.google.com/webmasters)
- [サイトの所有権を確認する](https://support.google.com/webmasters/answer/9008080)
- [サイトマップについて](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)