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

export interface LikeCountDto {
  postId: number;
  count: number;
}

export interface CommentDto {
  id: number;
  post_id: number;
  post_owner_id: number;
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

export interface ChatMessageDto {
  id: number;
  conversationId: number;
  conversationName: string | null;
  fromUserId: number;
  fromUserName: string | null;
  toUserId: number;
  toUserName: string | null;
  content: string;
  createdAt: string;
}

export interface ConversationSummaryDto {
  conversationId: number;
  conversationName: string | null;
  otherUserId: number;
  otherUserName: string | null;
  lastMessage: {
    id: number;
    content: string;
    senderName: string | null;
    receiverName: string | null;
    createdAt: string;
  } | null;
}

export interface MessageRequestDto {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  status: string;
  createdAt: string;
}

