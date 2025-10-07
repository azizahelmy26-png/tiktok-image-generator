import React, { useState, useEffect } from 'react';
import type { GeneratedImage } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: GeneratedImage;
  onGenerate: (prompt: string) => Promise<void>;
  generationState: {
    loading: boolean;
    error: string | null;
    url: string | null;
    progressMessage: string;
  };
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  image,
  onGenerate,
  generationState,
}) => {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (image) {
      setPrompt(image.videoMovementSuggestion);
    }
  }, [image]);

  if (!isOpen) return null;
  
  const handleDownload = () => {
    if (!generationState.url) return;
    const link = document.createElement('a');
    link.href = generationState.url;
    link.download = `fashion-video.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Buat Video dari Gambar</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </header>
        
        <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Gambar Sumber</h3>
                <img src={`data:image/jpeg;base64,${image.base64}`} alt="Sumber gambar untuk video" className="rounded-lg w-full object-contain" />
            </div>

            <div className="space-y-4 flex flex-col">
              {!generationState.url && (
                <>
                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">Prompt Video</label>
                    <textarea
                      id="prompt"
                      rows={8}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                      disabled={generationState.loading}
                    />
                  </div>
                  <div className="flex-grow" />
                  <button
                    onClick={() => onGenerate(prompt)}
                    disabled={generationState.loading}
                    className="w-full mt-auto flex items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95"
                  >
                    {generationState.loading ? <SpinnerIcon /> : 'Buat Video'}
                  </button>
                </>
              )}
              
              {generationState.loading && (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg p-6 text-center">
                    <SpinnerIcon />
                    <p className="mt-4 text-lg font-semibold text-gray-800">{generationState.progressMessage}</p>
                    <p className="mt-2 text-sm text-gray-500">Proses ini bisa memakan waktu beberapa menit. Harap jangan tutup jendela ini.</p>
                  </div>
              )}

              {generationState.error && (
                  <div className="flex flex-col items-center justify-center h-full bg-red-100 border border-red-300 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Gagal Membuat Video</h3>
                    <p className="text-sm text-red-600">{generationState.error}</p>
                  </div>
              )}

              {generationState.url && (
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Video Berhasil Dibuat!</h3>
                      <div className="relative">
                        <video src={generationState.url} controls autoPlay loop className="w-full rounded-lg"></video>
                      </div>
                      <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-all duration-300 transform active:scale-95"
                      >
                         <DownloadIcon /> Unduh Video
                      </button>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};