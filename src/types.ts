
export enum Tab {
  News = 'NEWS',
  Collection = 'COLLECTION',
  Bookmark = 'BOOKMARK',
}

export interface BookmarkItem {
  id: string;
  url: string;
  timestamp: number;
  title?: string;
}

export interface SuggestedLink {
  title:string;
  url: string;
  source?: string;
}

export interface NewsCluster {
  id: string;
  topicEnglish: string;
  topicChinese: string;
  articles: SuggestedLink[];
}
