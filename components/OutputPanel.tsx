import React from 'react';
import type { GeneratedImage, ProductConfig } from '../types';
import { ImageCard } from './ImageCard';
import { RegenerateIcon } from './icons/RegenerateIcon';

interface OutputPanelProps {
  products: ProductConfig[];
  images: Record<string, (GeneratedImage | null)[]>;
  loadingStates: Record<string, boolean[]>;
  error: string | null;
  onRegenerate: (productId: string, index: number) => void;
  onOpenVideoModal: (image: GeneratedImage) => void;
}

const SHOT_TITLES = ["1. Foto Gaya UGC 1", "2. Foto Gaya UGC 2", "3. Foto B-Roll", "4. Foto Fokus Produk"];

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl animate-pulse shadow">
    <div className="aspect-[3/4] bg-gray-200 rounded-xl"></div>
  </div>
);

const EmptySlotCard: React.FC = () => (
    <div className="aspect-[3/4] bg-white/60 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
    </div>
);


export const OutputPanel: React.FC<OutputPanelProps> = ({ products, images, loadingStates, error, onRegenerate, onOpenVideoModal }) => {
  const hasAnyContent = Object.keys(images).length > 0 || Object.keys(loadingStates).some(key => loadingStates[key]?.some(s => s));

  if (!hasAnyContent && !error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white/60 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-700">Area Output Anda</h3>
        <p className="mt-2 text-gray-500">
          Hasil foto yang Anda buat akan muncul di sini.
          <br />
          Unggah referensi dan sesuaikan pengaturan di sebelah kiri untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative">
          <strong className="font-bold">Terjadi Kesalahan!</strong>
          <span className="block sm:inline whitespace-pre-wrap mt-1">{error}</span>
        </div>
      )}
      <div className="space-y-12">
        {products.map((product, productIndex) => {
          const productImages = images[product.id] || Array(4).fill(null);
          const productLoadingStates = loadingStates[product.id] || Array(4).fill(false);

          const hasContentForThisProduct = productImages.some(i => i) || productLoadingStates.some(s => s);
          if (!hasContentForThisProduct) return null;

          return (
            <div key={product.id}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                Produk {productIndex + 1}
                {product.outfitReference && 
                  <span className="text-sm font-normal text-gray-500 ml-2 truncate">({product.outfitReference.file.name})</span>
                }
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productLoadingStates.map((isLoading, index) => {
                  const image = productImages[index];
                  const isShotSelected = 
                      (index === 0 && product.shotsToGenerate.ugc1) ||
                      (index === 1 && product.shotsToGenerate.ugc2) ||
                      (index === 2 && product.shotsToGenerate.broll) ||
                      (index === 3 && product.shotsToGenerate.productOnly);

                  return (
                    <div key={`slot-${product.id}-${index}`} className="flex flex-col gap-2">
                      <h4 className="text-sm font-semibold text-center text-gray-600">{SHOT_TITLES[index]}</h4>
                      {(() => {
                        if (isLoading) {
                          return <SkeletonCard />;
                        }
                        if (image) {
                          return <ImageCard image={image} index={index} onOpenVideoModal={onOpenVideoModal} />;
                        }
                        // Show empty slot only if the shot was part of the generation
                        if (isShotSelected || hasContentForThisProduct) {
                           return <EmptySlotCard />;
                        }
                        return null;
                      })()}
                      {!isLoading && image && (
                        <button
                          onClick={() => onRegenerate(product.id, index)}
                          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-all text-sm transform active:scale-95"
                        >
                          <RegenerateIcon /> Buat Ulang
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};