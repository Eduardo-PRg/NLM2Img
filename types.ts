export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING_PDF = 'PROCESSING_PDF',
  GENERATING_STAMP = 'GENERATING_STAMP',
  READY = 'READY',
  ERROR = 'ERROR'
}

export type LayoutMode = 'vertical' | 'grid';

export interface StampConfig {
  text: string;
  subText: string;
  size: number;
  color: string;
  opacity: number;
  shape: 'square' | 'circle';
  paddingX: number;
  paddingY: number;
}

export interface PdfPageImage {
  blob: string;
  width: number;
  height: number;
  pageIndex: number;
}