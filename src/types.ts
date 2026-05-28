export interface User {
  id: string;
  username: string;
  bio: string;
  avatar: string;
  aura: string;
  energy: number;
  created: number;
  online: boolean;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  text: string;
  media: string;
  time: number;
  reaction: string;
  replyTo: string;
  replyToName: string;
  type: string;
  fileUrl: string;
  edited?: number;
  roomId?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  creator: string;
  creatorName: string;
  createdAt: number;
  lastActivity: number;
  lastMessage?: string;
  participantCount: number;
}

export interface Theme {
  bg: string;
  bg2: string;
  card: string;
  cardOverlay: string;
  border: string;
  borderHover: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  glassBg: string;
  glassText: string;
  glassBorder: string;
  glassShimmer: string;
}

export interface LangDict {
  [key: string]: string;
}
