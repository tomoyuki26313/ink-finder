// Japanese Tattoo Artists Instagram Handles
// This is a curated list of tattoo artists in Japan

export interface ArtistInstagramInfo {
  name_ja: string;
  name_en: string;
  instagram_handle: string;
  location: string;
  styles: string[];
  studio?: string;
}

export const japaneseTattooArtists: ArtistInstagramInfo[] = [
  {
    name_ja: "ホリトモ",
    name_en: "Horitomo",
    instagram_handle: "horitomo_stateofgrace",
    location: "横浜",
    styles: ["和彫り", "伝統"],
    studio: "State of Grace"
  },
  {
    name_ja: "ホリヨシ III",
    name_en: "Horiyoshi III",
    instagram_handle: "horiyoshi_iii",
    location: "横浜",
    styles: ["和彫り", "伝統"],
    studio: "Horiyoshi III Museum"
  },
  {
    name_ja: "ガクト",
    name_en: "Gakkin",
    instagram_handle: "gakkin_",
    location: "京都",
    styles: ["ブラックワーク", "ジオメトリック"],
    studio: "Chopstick Tattoo"
  },
  {
    name_ja: "タク",
    name_en: "Taku Oshima",
    instagram_handle: "taku_oshima",
    location: "東京",
    styles: ["リアリスティック", "ブラック&グレー"],
    studio: "Invasion Club"
  },
  {
    name_ja: "ユウ",
    name_en: "Yu Tattooer",
    instagram_handle: "yu.tattooer",
    location: "東京",
    styles: ["ミニマル", "ファインライン"],
    studio: "Studio Unknown"
  },
  {
    name_ja: "ミサ",
    name_en: "Misa",
    instagram_handle: "masa__tattooer",
    location: "大阪",
    styles: ["水彩", "カラフル"],
    studio: "Three Tides Tattoo"
  },
  {
    name_ja: "ホリベン",
    name_en: "Horiben",
    instagram_handle: "horiben_horibenny",
    location: "横浜",
    styles: ["和彫り", "ネオジャパニーズ"],
    studio: "Horiben Family"
  },
  {
    name_ja: "ニッシー",
    name_en: "Nishy",
    instagram_handle: "nishy_tattoo",
    location: "東京",
    styles: ["アメリカントラディショナル", "オールドスクール"],
    studio: "Good Times Ink"
  },
  {
    name_ja: "サブロウ",
    name_en: "Saburo",
    instagram_handle: "saburotattooer",
    location: "名古屋",
    styles: ["ブラックワーク", "ドットワーク"],
    studio: "Tattoo Studio Ray's"
  },
  {
    name_ja: "ヨコ",
    name_en: "Yoko",
    instagram_handle: "yoko.tattoo",
    location: "福岡",
    styles: ["ボタニカル", "ファインライン"],
    studio: "Tattoo Studio Muscat"
  }
];

// Helper function to get Instagram profile URL
export function getInstagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

// Helper function to search artists by style
export function searchArtistsByStyle(style: string): ArtistInstagramInfo[] {
  return japaneseTattooArtists.filter(artist => 
    artist.styles.some(s => s.toLowerCase().includes(style.toLowerCase()))
  );
}

// Helper function to search artists by location
export function searchArtistsByLocation(location: string): ArtistInstagramInfo[] {
  return japaneseTattooArtists.filter(artist => 
    artist.location.toLowerCase().includes(location.toLowerCase())
  );
}