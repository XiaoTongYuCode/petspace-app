export type FeedAuthor = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export type FeedPost = {
  id: string;
  caption: string;
  imageUrl: string;
  imageObjectKey: string | null;
  category: string;
  location: string | null;
  viewsCount: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount: number;
  createdAt: string;
  author: FeedAuthor;
  viewerHasLiked: boolean;
  viewerHasFavorited: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: FeedAuthor;
  replies: PostComment[];
};

export type ProfileSummary = {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarObjectKey: string | null;
  coverUrl: string | null;
  coverObjectKey: string | null;
  profileViews: number;
  postsCount: number;
  totalLikes: number;
  totalViews: number;
  createdAt: string;
};

export type CheckInStatus = {
  authenticated: boolean;
  databaseReady: boolean;
  checkedInToday: boolean;
  lastDate: string | null;
  streak: number;
  today: string;
  scope: string;
  timeZone: string;
};
