/**
 * YouTube Channel Types and Interfaces
 */

export type ChannelType = 'personal' | 'business';

export type VideoCategory =
  | 'tutorial'
  | 'documentation'
  | 'demo'
  | 'review'
  | 'announcement'
  | 'vlog'
  | 'marketing'
  | 'educational'
  | 'case-study'
  | 'webinar';

export type VideoStatus = 'draft' | 'scheduled' | 'published' | 'private' | 'unlisted';

export interface YouTubeChannel {
  id: string;
  type: ChannelType;
  email: string;
  name: string;
  description: string;
  purpose: string;
  credentials: YouTubeCredentials;
}

export interface YouTubeCredentials {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: Date;
}

export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  category: VideoCategory;
  targetChannel: ChannelType;
  keywords: string[];
  estimatedDuration: number; // minutes
  priority: 'low' | 'medium' | 'high';
  status: 'idea' | 'scripted' | 'recorded' | 'editing' | 'published';
  targetAudience: string;
  keyTakeaways: string[];
  resources?: string[];
  scheduledDate?: Date;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
  publishAt?: string; // ISO 8601 format
  thumbnailUrl?: string;
  playlist?: string;
}

export interface UploadOptions {
  channelType: ChannelType;
  filePath: string;
  metadata: VideoMetadata;
  notifySubscribers?: boolean;
  madeForKids?: boolean;
  autoLevels?: boolean;
}

export interface VideoAnalytics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTimeHours: number;
  averageViewDuration: number;
  clickThroughRate: number;
  engagement: number;
}

export interface ContentCalendar {
  month: string;
  videos: {
    idea: VideoIdea;
    scheduledDate: Date;
    channel: ChannelType;
  }[];
}
