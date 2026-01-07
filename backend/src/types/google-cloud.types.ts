/**
 * Google Cloud Platform Types and Interfaces
 */

// ==================== Google Drive ====================

export type DriveFileType =
  | 'application/vnd.google-apps.folder'
  | 'application/vnd.google-apps.document'
  | 'application/vnd.google-apps.spreadsheet'
  | 'application/vnd.google-apps.presentation'
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'video/mp4'
  | 'text/plain';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: DriveFileType;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  thumbnailLink?: string;
}

export interface DriveUploadOptions {
  name: string;
  mimeType: DriveFileType;
  parents?: string[];
  description?: string;
}

// ==================== Google Sheets ====================

export interface SheetRange {
  sheetName: string;
  startRow: number;
  startColumn: string;
  endRow?: number;
  endColumn?: string;
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
    rowCount: number;
    columnCount: number;
  }[];
}

export type CellValue = string | number | boolean | null;

// ==================== Google Calendar ====================

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string; // ISO 8601
    date?: string; // YYYY-MM-DD (all-day events)
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  recurrence?: string[]; // RFC 5545 RRULE
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: 'email' | 'popup';
      minutes: number;
    }[];
  };
  colorId?: string;
}

// ==================== Google Cloud Storage ====================

export interface GCSFileMetadata {
  name: string;
  bucket: string;
  contentType?: string;
  size: number;
  timeCreated: string;
  updated: string;
  publicUrl?: string;
  signedUrl?: string;
}

export interface GCSUploadOptions {
  destination: string;
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
  resumable?: boolean;
}

// ==================== Google Cloud Vision ====================

export type VisionFeatureType =
  | 'LABEL_DETECTION'
  | 'TEXT_DETECTION'
  | 'DOCUMENT_TEXT_DETECTION'
  | 'FACE_DETECTION'
  | 'LOGO_DETECTION'
  | 'LANDMARK_DETECTION'
  | 'SAFE_SEARCH_DETECTION'
  | 'IMAGE_PROPERTIES'
  | 'OBJECT_LOCALIZATION'
  | 'WEB_DETECTION';

export interface VisionAnnotation {
  labels?: {
    description: string;
    score: number;
    topicality: number;
  }[];
  text?: string;
  fullText?: string;
  faces?: {
    boundingPoly: any;
    fdBoundingPoly: any;
    landmarks: any[];
    rollAngle: number;
    panAngle: number;
    tiltAngle: number;
    detectionConfidence: number;
    landmarkingConfidence: number;
    joyLikelihood: string;
    sorrowLikelihood: string;
    angerLikelihood: string;
    surpriseLikelihood: string;
  }[];
  safeSearch?: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
}

// ==================== Google Cloud Translation ====================

export type LanguageCode =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ar'
  | 'hi';

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: LanguageCode;
  input: string;
}

export interface LanguageDetectionResult {
  language: LanguageCode;
  confidence: number;
  isReliable: boolean;
}

// ==================== Google Cloud Natural Language ====================

export interface EntityAnalysis {
  entities: {
    name: string;
    type:
      | 'PERSON'
      | 'LOCATION'
      | 'ORGANIZATION'
      | 'EVENT'
      | 'WORK_OF_ART'
      | 'CONSUMER_GOOD'
      | 'OTHER';
    salience: number;
    metadata: Record<string, string>;
    mentions: {
      text: string;
      type: 'PROPER' | 'COMMON';
    }[];
  }[];
}

export interface SentimentAnalysis {
  documentSentiment: {
    score: number; // -1.0 (negative) to 1.0 (positive)
    magnitude: number; // 0.0 to infinity (emotional intensity)
  };
  language: string;
  sentences: {
    text: string;
    sentiment: {
      score: number;
      magnitude: number;
    };
  }[];
}

export interface SyntaxAnalysis {
  tokens: {
    text: string;
    partOfSpeech: string;
    lemma: string;
    dependencyEdge: {
      headTokenIndex: number;
      label: string;
    };
  }[];
  language: string;
}
