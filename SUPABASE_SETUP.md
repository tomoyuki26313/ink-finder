# 🗃️ Supabase完全セットアップガイド

このガイドに従ってSupabaseデータベースを設定し、デモモードから実際のデータベースに移行しましょう。

## 📋 事前準備

- GitHubアカウント（Supabaseログイン用）
- メールアドレス

## ステップ 1: Supabaseアカウント作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ
4. 利用規約に同意

## ステップ 2: 新しいプロジェクト作成

1. ダッシュボードで「New project」をクリック
2. 組織を選択（初回の場合は自動で作成されます）
3. プロジェクト詳細を入力：
   ```
   Project name: ink-finder
   Database Password: [自動生成されたパスワードを使用] ⚠️ このパスワードを必ず保存！
   Region: Northeast Asia (Tokyo)
   ```
4. 「Create new project」をクリック
5. プロジェクト作成完了まで約1-2分待機

## ステップ 3: データベーステーブル作成

### 3.1 SQL Editorにアクセス
1. 左サイドバーから「SQL Editor」をクリック
2. 「New query」をクリック

### 3.2 テーブル作成SQL実行
以下のSQLを順番に実行してください：

#### A. artistsテーブル作成
```sql
-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  styles TEXT[] NOT NULL DEFAULT '{}',
  price_range TEXT NOT NULL,
  booking_url TEXT NOT NULL,
  instagram_handle TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  profile_icon JSONB NOT NULL DEFAULT '{"icon": "🎨", "color": "from-purple-500 to-pink-500"}'::jsonb
);

-- Add check constraints
ALTER TABLE artists ADD CONSTRAINT check_name_length CHECK (char_length(name) >= 2);
ALTER TABLE artists ADD CONSTRAINT check_bio_length CHECK (char_length(bio) >= 10);
ALTER TABLE artists ADD CONSTRAINT check_price_range_length CHECK (char_length(price_range) >= 3);
ALTER TABLE artists ADD CONSTRAINT check_view_count_positive CHECK (view_count >= 0);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE
  ON artists FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

実行後、緑色の「Success」メッセージが表示されることを確認

#### B. セキュリティポリシー設定
```sql
-- Enable RLS on artists table
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all artists
CREATE POLICY "Artists are viewable by everyone"
  ON artists FOR SELECT
  USING (true);

-- Policy: Increment view count (using a function)
CREATE OR REPLACE FUNCTION increment_artist_view_count(artist_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE artists 
  SET view_count = view_count + 1 
  WHERE id = artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION increment_artist_view_count TO anon;

-- Optional: Admin policies (requires authentication)
-- Policy: Allow authenticated users to insert artists
CREATE POLICY "Authenticated users can insert artists"
  ON artists FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update their own artists
CREATE POLICY "Authenticated users can update artists"
  ON artists FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete artists
CREATE POLICY "Authenticated users can delete artists"
  ON artists FOR DELETE
  TO authenticated
  USING (true);
```

#### C. パフォーマンス最適化インデックス
```sql
-- Index for location-based searches
CREATE INDEX idx_artists_location ON artists(location);

-- Index for view count sorting
CREATE INDEX idx_artists_view_count ON artists(view_count DESC);

-- Index for created_at sorting
CREATE INDEX idx_artists_created_at ON artists(created_at DESC);

-- Full text search index for name and bio
CREATE INDEX idx_artists_name_search ON artists USING gin(to_tsvector('english', name));
CREATE INDEX idx_artists_bio_search ON artists USING gin(to_tsvector('english', bio));

-- GIN index for styles array searches
CREATE INDEX idx_artists_styles ON artists USING gin(styles);

-- Composite index for common queries
CREATE INDEX idx_artists_location_view_count ON artists(location, view_count DESC);

-- Index for Instagram handle lookups
CREATE INDEX idx_artists_instagram ON artists(instagram_handle);
```

#### D. サンプルデータ挿入
```sql
-- Insert sample data
INSERT INTO artists (name, bio, location, address, styles, price_range, booking_url, instagram_handle, images, view_count, profile_icon) VALUES
  ('Yuki Tanaka', 'Traditional Japanese tattoo artist specializing in irezumi and modern interpretations.', 'Tokyo, Japan', '〒150-0001 東京都渋谷区神宮前4-12-10', ARRAY['Japanese Traditional', 'Blackwork', 'Neo-Japanese'], '¥20,000 - ¥100,000', 'https://booking.example.com/yuki', '@yukitattoo', ARRAY['https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28', 'https://images.unsplash.com/photo-1567701554261-fcc4171c4948', 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d'], 1234, '{"icon": "🐉", "color": "from-red-500 to-orange-500"}'::jsonb),
  
  ('Maria Santos', 'Fine line specialist creating delicate botanical and minimalist designs.', 'Barcelona, Spain', 'Carrer de Pau Claris, 95, 08009 Barcelona', ARRAY['Fine Line', 'Minimalist', 'Botanical'], '€150 - €800', 'https://booking.example.com/maria', '@mariafineink', ARRAY['https://images.unsplash.com/photo-1475721027785-f74eccf877e2', 'https://images.unsplash.com/photo-1562113538-9e4c50c0116a', 'https://images.unsplash.com/photo-1582971805810-250e60bbee51'], 892, '{"icon": "🌿", "color": "from-green-500 to-emerald-500"}'::jsonb),
  
  ('Alex Kim', 'Contemporary artist blending geometric patterns with watercolor techniques.', 'Seoul, South Korea', '서울특별시 마포구 와우산로 94', ARRAY['Geometric', 'Watercolor', 'Abstract'], '₩200,000 - ₩1,500,000', 'https://booking.example.com/alex', '@alexink', ARRAY['https://images.unsplash.com/photo-1611501275019-9b5cda994e8d', 'https://images.unsplash.com/photo-1567701554261-fcc4171c4948', 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28'], 567, '{"icon": "💎", "color": "from-purple-500 to-pink-500"}'::jsonb),
  
  ('James Mitchell', 'American traditional specialist with 15 years of experience.', 'Los Angeles, USA', '1234 Sunset Blvd, Los Angeles, CA 90028', ARRAY['American Traditional', 'Old School', 'Bold Line'], '$200 - $1,500', 'https://booking.example.com/james', '@jamestrad', ARRAY['https://images.unsplash.com/photo-1565058379802-2755a80ba2f0', 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28', 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d'], 2341, '{"icon": "⚡", "color": "from-yellow-500 to-orange-500"}'::jsonb),
  
  ('Sophie Chen', 'Realism artist specializing in portraits and nature scenes.', 'Vancouver, Canada', '789 Granville St, Vancouver, BC V6Z 1K3', ARRAY['Realism', 'Portrait', 'Black and Grey'], '$300 - $2,000', 'https://booking.example.com/sophie', '@sophierealism', ARRAY['https://images.unsplash.com/photo-1611501275019-9b5cda994e8d', 'https://images.unsplash.com/photo-1565058379802-2755a80ba2f0', 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28'], 1678, '{"icon": "🎨", "color": "from-blue-500 to-indigo-500"}'::jsonb),
  
  ('Ravi Patel', 'Dotwork and mandala specialist creating intricate spiritual designs.', 'Mumbai, India', 'Linking Road, Bandra West, Mumbai 400050', ARRAY['Dotwork', 'Mandala', 'Sacred Geometry'], '₹5,000 - ₹50,000', 'https://booking.example.com/ravi', '@ravidotwork', ARRAY['https://images.unsplash.com/photo-1567701554261-fcc4171c4948', 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d', 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28'], 923, '{"icon": "🔮", "color": "from-indigo-500 to-purple-500"}'::jsonb);
```

### 3.3 データベース確認
1. 左サイドバーから「Table Editor」をクリック
2. `artists`テーブルを選択
3. 6人のアーティストデータが表示されることを確認

## ステップ 4: API認証情報取得

1. 左サイドバーから「Settings」をクリック
2. 「API」セクションをクリック
3. 以下をコピーして保存：

### Project URL
```
https://xxxxxxxxxxxxxxxx.supabase.co
```

### anon public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ステップ 5: 環境変数設定

1. プロジェクトルートの`.env.local`ファイルを開く
2. 以下を更新（xxxの部分を先ほどコピーした値に置き換え）：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Maps API（後で設定）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

3. ファイルを保存

## ステップ 6: アプリケーション再起動

1. ターミナルで開発サーバーを停止（Ctrl + C）
2. 再起動：
   ```bash
   npm run dev
   ```
3. ブラウザで http://localhost:3000 にアクセス
4. 黄色の「Demo Mode」バナーが消えることを確認

## ✅ 完了確認

以下が動作すれば設定完了です：

- [ ] アーティスト一覧が表示される
- [ ] 検索機能が動作する
- [ ] フィルター機能が動作する
- [ ] アーティストカードをクリックするとビューカウントが増加
- [ ] 「Demo Mode」バナーが表示されない

## 🛠️ トラブルシューティング

### Error: "Invalid URL"
- `.env.local`のURLをコピー＆ペーストで再確認
- URLの最後に余分な`/`が付いていないか確認

### データが表示されない
- Supabaseダッシュボードで`artists`テーブルにデータがあるか確認
- ブラウザのDeveloper Tools > Network タブでエラーをチェック

### 認証エラー
- API keyが正しくコピーされているか確認
- 環境変数変更後に開発サーバーを再起動

## 🎉 次のステップ

データベース接続が完了したら：

1. 独自のアーティストデータを追加
2. Google Maps API設定（地図表示用）
3. 画像アップロード機能の実装
4. 管理者認証システムの追加

---

**注意**: `service_role` keyは絶対に公開しないでください。アプリでは`anon public` keyのみを使用します。