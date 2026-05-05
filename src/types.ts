import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  ADMIN = 'admin',
  PARENT = 'parent'
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface KBContent {
  id: string;
  content: string;
  source: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  createdAt: Timestamp;
}
