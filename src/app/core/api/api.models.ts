export interface UserDto {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface FriendDto {
  id: number;
  name: string | null;
}

export interface PostDto {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export type FriendshipStatus =
  | 'SELF'
  | 'NONE'
  | 'FRIENDS'
  | 'REQUEST_SENT'
  | 'REQUEST_RECEIVED'
  | 'BLOCKED_BY_ME'
  | 'BLOCKED_BY_OTHER';

