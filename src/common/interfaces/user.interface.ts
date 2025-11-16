export interface UserNode {
  userId: string;
  username: string;
  name?: string;
}

export interface RecommendedUser {
  userId: string;
  username: string;
  name?: string;
  score: number;
  mutualFriends: number;
  reason: string;
  location?: string;
}
