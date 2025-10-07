export interface ShotConfig {
    background: string;
    pose: string;
    lighting: string;
}

export interface GeneratedImage {
    base64: string;
    prompt: string;
    shotType: string;
    videoMovementSuggestion: string;
    voiceOverScript: string;
}

export interface ImageFile {
    file: File;
    preview: string;
}


export interface ProductConfig {
  id: string;
  outfitReference: ImageFile | null;
  background: string;
  pose1: string; // For UGC 1
  pose2: string; // For UGC 2
  shotsToGenerate: {
    ugc1: boolean;
    ugc2: boolean;
    broll: boolean;
    productOnly: boolean;
  };
}
