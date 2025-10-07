import React, { useState } from 'react';
import type { GeneratedImage } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';
import { VideoIcon } from './icons/VideoIcon';

interface ImageCardProps {
  image: GeneratedImage;
  index: number;
  onOpenVideoModal: (image: GeneratedImage) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, index, onOpenVideoModal }) => {
  const imageUrl = `data:image/jpeg;base64,${image.base64}`;
  const [suggestionCopied, setSuggestionCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `fashion-shot-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySuggestion = () => {
    if (suggestionCopied) return;
    navigator.clipboard.writeText(image.videoMovementSuggestion);
    setSuggestionCopied(true);
    setTimeout(() => setSuggestionCopied(false), 2000);
  };

  const handleCopyScript = () => {
    if (scriptCopied || !image.voiceOverScript) return;
    navigator.clipboard.writeText(image.voiceOverScript);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 ease-in-out hover:shadow-xl hover:border-purple-400">
      <div className="relative aspect-[3/4]">
        <img
          src={imageUrl}
          alt={`Hasil foto fashion ${index + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
            <button
              onClick={() => onOpenVideoModal(image)}
              className="w-10 h-10 flex items-center justify-center bg-green-600/80 backdrop-blur-sm rounded-full text-white hover:bg-green-500 transition-all transform active:scale-90"
              aria-label="Buat Video dari Gambar"
              title="Buat Video dari Gambar"
            >
              <VideoIcon />
            </button>
           <button
              onClick={handleDownload}
              className="w-10 h-10 flex items-center justify-center bg-purple-600/80 backdrop-blur-sm rounded-full text-white hover:bg-purple-500 transition-all transform active:scale-90"
              aria-label="Unduh Gambar"
              title="Unduh Gambar"
            >
              <DownloadIcon />
            </button>
        </div>
        <div className="absolute bottom-2 left-2">
            <p className="text-white font-bold text-xs bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">{image.shotType}</p>
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
        <div>
            <label className="text-xs font-semibold text-purple-600 mb-1 block">Saran Gerakan Video</label>
            <textarea
                readOnly
                value={image.videoMovementSuggestion}
                className="w-full h-28 p-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                aria-label="Saran Gerakan Video"
            />
            <button 
                onClick={handleCopySuggestion}
                className={`w-full mt-2 flex items-center justify-center gap-2 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm ${suggestionCopied ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
                {suggestionCopied ? 'Saran Tersalin!' : <><CopyIcon /> Salin Saran</>}
            </button>
        </div>
        <hr className="border-gray-200" />
        <div>
            <label className="text-xs font-semibold text-green-600 mb-1 block">Script Voice Over</label>
            <textarea
                readOnly
                value={image.voiceOverScript || "Skrip akan dibuat bersamaan dengan gambar..."}
                className="w-full h-28 p-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-green-500"
                aria-label="Script Voice Over"
            />
            <button 
                onClick={handleCopyScript}
                disabled={!image.voiceOverScript}
                className={`w-full mt-2 flex items-center justify-center gap-2 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm ${scriptCopied ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400'}`}
            >
                {scriptCopied ? 'Skrip Tersalin!' : <><CopyIcon /> Salin Skrip</>}
            </button>
        </div>
      </div>
    </div>
  );
};