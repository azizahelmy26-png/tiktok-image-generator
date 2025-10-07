
import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { generateFashionShots, generateVideo } from './services/geminiService';
import type { GeneratedImage, ImageFile, ProductConfig } from './types';
import { LIGHTING_OPTIONS, ACTION_POSE_IDEAS, BACKGROUND_IDEAS } from './constants';
import { VideoModal } from './components/VideoModal';

const createDefaultProduct = (): ProductConfig => ({
  id: `product_${Date.now()}_${Math.random()}`,
  outfitReference: null,
  background: BACKGROUND_IDEAS[0].value,
  pose1: ACTION_POSE_IDEAS[0].value,
  pose2: ACTION_POSE_IDEAS[1].value, // Default pose berbeda untuk UGC 2
  shotsToGenerate: {
    ugc1: true,
    ugc2: true,
    broll: true,
    productOnly: true,
  },
});


function App() {
  // Global settings
  const [lighting, setLighting] = useState<string>(LIGHTING_OPTIONS[0].value);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [resolution, setResolution] = useState('standard');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [faceReference, setFaceReference] = useState<ImageFile | null>(null);
  const [negativePrompt, setNegativePrompt] = useState<string>('deformed, blurry, watermark, text, signature, worst quality, low quality');

  // Per-product settings
  const [products, setProducts] = useState<ProductConfig[]>([createDefaultProduct()]);

  // State for results, indexed by product.id
  const [generatedImages, setGeneratedImages] = useState<Record<string, (GeneratedImage | null)[]>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean[]>>({});
  const [error, setError] = useState<string | null>(null);

  // State for video modal
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<GeneratedImage | null>(null);
  const [videoGenerationState, setVideoGenerationState] = useState({
    loading: false,
    error: null as string | null,
    url: null as string | null,
    progressMessage: '',
  });

  const handleOpenVideoModal = (image: GeneratedImage) => {
    setSelectedImageForVideo(image);
    setVideoGenerationState({ loading: false, error: null, url: null, progressMessage: '' });
  };

  const handleCloseVideoModal = () => {
    if (videoGenerationState.url) {
      URL.revokeObjectURL(videoGenerationState.url);
    }
    setSelectedImageForVideo(null);
  };
  
  const handleGenerateVideo = useCallback(async (prompt: string) => {
    if (!selectedImageForVideo) return;

    setVideoGenerationState({
      loading: true,
      error: null,
      url: null,
      progressMessage: 'Memulai...'
    });

    try {
      const videoUrl = await generateVideo(
        prompt,
        selectedImageForVideo.base64,
        (progressMessage: string) => {
          setVideoGenerationState(prev => ({...prev, progressMessage}));
        }
      );
      setVideoGenerationState(prev => ({ ...prev, loading: false, url: videoUrl }));
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui saat membuat video.';
      setVideoGenerationState({ loading: false, error: errorMessage, url: null, progressMessage: '' });
    }
  }, [selectedImageForVideo]);

  const SHOT_TYPES: Readonly<Array<'UGC_1' | 'UGC_2' | 'B_ROLL' | 'PRODUCT_ONLY'>> = ['UGC_1', 'UGC_2', 'B_ROLL', 'PRODUCT_ONLY'];

  const getSelectedShotsForProduct = (product: ProductConfig) => {
    const shots: { type: 'UGC_1' | 'UGC_2' | 'B_ROLL' | 'PRODUCT_ONLY', index: number }[] = [];
    if (product.shotsToGenerate.ugc1) shots.push({ type: 'UGC_1', index: 0 });
    if (product.shotsToGenerate.ugc2) shots.push({ type: 'UGC_2', index: 1 });
    if (product.shotsToGenerate.broll) shots.push({ type: 'B_ROLL', index: 2 });
    if (product.shotsToGenerate.productOnly) shots.push({ type: 'PRODUCT_ONLY', index: 3 });
    return shots;
  };

  const handleGenerate = useCallback(async (productIdsToGenerate: string[]) => {
    if (productIdsToGenerate.length === 0) return;
    if (!faceReference?.file) {
      setError('Harap unggah gambar referensi wajah.');
      return;
    }
    
    const productsToProcess = products.filter(p => productIdsToGenerate.includes(p.id) && p.outfitReference?.file);

    if (productsToProcess.length < productIdsToGenerate.length) {
      setError('Harap unggah gambar referensi pakaian untuk semua produk yang dipilih.');
    }
     if (productsToProcess.length === 0) {
      setError('Harap unggah gambar referensi pakaian untuk produk yang dipilih.');
      return;
    }

    setLoadingStates(prev => {
        const newStates = {...prev};
        productsToProcess.forEach(p => {
          const shots = getSelectedShotsForProduct(p);
          const productLoadingState = newStates[p.id] || Array(4).fill(false);
          shots.forEach(shot => productLoadingState[shot.index] = true);
          newStates[p.id] = productLoadingState;
        });
        return newStates;
    });
    setError(null);

    const allPromises = productsToProcess.map(async (product) => {
        const shotsToGenerate = getSelectedShotsForProduct(product);
        if (shotsToGenerate.length === 0) return { productId: product.id, results: [], originalIndices: [] };

        const typesToGenerate = shotsToGenerate.map(s => s.type);
        const originalIndices = shotsToGenerate.map(s => s.index);
        
        try {
            const results = await generateFashionShots(
                product.background,
                { ugc1: product.pose1, ugc2: product.pose2 },
                lighting,
                faceReference.file!,
                product.outfitReference!.file,
                typesToGenerate,
                aspectRatio,
                resolution,
                gender,
                negativePrompt
            );
            return { productId: product.id, results, originalIndices };
        } catch (err) {
            console.error(`Error generating for product ${product.id}:`, err);
            return { productId: product.id, error: err, originalIndices };
        }
    });

    const settledResults = await Promise.all(allPromises);

    const newGlobalImages = {...generatedImages};
    const newGlobalLoading = {...loadingStates};
    const globalErrors: string[] = [];

    settledResults.forEach(productResult => {
        if (!productResult) return;
        const { productId, results, error: productError, originalIndices } = productResult;

        const productImages = [...(newGlobalImages[productId] || Array(4).fill(null))];
        const productLoading = [...(newGlobalLoading[productId] || Array(4).fill(false))];

        if (productError) {
             globalErrors.push(`Produk: ${productError instanceof Error ? productError.message : 'Gagal.'}`);
             originalIndices.forEach(idx => {
                productLoading[idx] = false;
             });
        } else if (results) {
            let resultIndex = 0;
            originalIndices.forEach(originalIndex => {
                const result = results[resultIndex];
                if (result.status === 'fulfilled') {
                    productImages[originalIndex] = result.value;
                } else {
                    console.error(`Error generating image ${originalIndex} for product ${productId}:`, result.reason);
                    const reason = result.reason as Error;
                    globalErrors.push(`Foto ${originalIndex + 1}: ${reason.message || 'Gagal.'}`);
                    productImages[originalIndex] = null;
                }
                productLoading[originalIndex] = false;
                resultIndex++;
            });
        }
        
        newGlobalImages[productId] = productImages;
        newGlobalLoading[productId] = productLoading;
    });

    setGeneratedImages(newGlobalImages);
    setLoadingStates(newGlobalLoading);

    if (globalErrors.length > 0) {
        setError(globalErrors.join('\n'));
    }
  }, [products, faceReference, lighting, aspectRatio, resolution, gender, negativePrompt]);

  const handleRegenerate = useCallback(async (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !faceReference?.file || !product.outfitReference?.file) {
      setError('Referensi wajah atau pakaian tidak ditemukan untuk regenerasi.');
      return;
    }
  
    setLoadingStates(prev => {
      const newStates = { ...prev };
      const productStates = newStates[productId] ? [...newStates[productId]] : Array(4).fill(false);
      productStates[index] = true;
      newStates[productId] = productStates;
      return newStates;
    });
    setError(null);
  
    const typeToGenerate = SHOT_TYPES[index];
  
    try {
      const results = await generateFashionShots(
        product.background,
        { ugc1: product.pose1, ugc2: product.pose2 },
        lighting,
        faceReference.file,
        product.outfitReference.file,
        [typeToGenerate],
        aspectRatio,
        resolution,
        gender,
        negativePrompt
      );
  
      const result = results[0];
      if (result.status === 'fulfilled') {
        setGeneratedImages(prev => {
          const newImages = { ...prev };
          const productImages = newImages[productId] ? [...newImages[productId]] : Array(4).fill(null);
          productImages[index] = result.value;
          newImages[productId] = productImages;
          return newImages;
        });
      } else {
        throw result.reason;
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat regenerasi.');
    } finally {
      setLoadingStates(prev => {
        const newStates = { ...prev };
        const productStates = newStates[productId] ? [...newStates[productId]] : Array(4).fill(false);
        productStates[index] = false;
        newStates[productId] = productStates;
        return newStates;
      });
    }
  }, [products, faceReference, lighting, aspectRatio, resolution, gender, negativePrompt]);


  const isAnythingLoading = Object.values(loadingStates).some((productStates: boolean[]) => productStates.some(s => s));
  
  const handleAddProduct = () => {
    setProducts(prev => [...prev, createDefaultProduct()]);
  };
  const handleRemoveProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    // Also clean up state
    setGeneratedImages(prev => {
      const newState = {...prev};
      delete newState[id];
      return newState;
    });
    setLoadingStates(prev => {
      const newState = {...prev};
      delete newState[id];
      return newState;
    })
  };
  
  const handleUpdateProduct = (id: string, updatedConfig: Partial<ProductConfig>) => {
    setProducts(prev => prev.map(p => p.id === id ? {...p, ...updatedConfig} : p));
  }

  return (
    <div className="min-h-screen text-gray-900 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          <div className="lg:col-span-4 xl:col-span-3">
            <ControlPanel
              products={products}
              onAddProduct={handleAddProduct}
              onRemoveProduct={handleRemoveProduct}
              onUpdateProduct={handleUpdateProduct}
              faceReference={faceReference}
              setFaceReference={setFaceReference}
              lighting={lighting}
              setLighting={setLighting}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              resolution={resolution}
              setResolution={setResolution}
              gender={gender}
              setGender={setGender}
              negativePrompt={negativePrompt}
              setNegativePrompt={setNegativePrompt}
              onGenerate={handleGenerate}
              isLoading={isAnythingLoading}
            />
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <OutputPanel
              products={products}
              images={generatedImages}
              loadingStates={loadingStates}
              error={error}
              onRegenerate={handleRegenerate}
              onOpenVideoModal={handleOpenVideoModal}
            />
          </div>
        </div>
      </main>
      {selectedImageForVideo && (
        <VideoModal
          isOpen={!!selectedImageForVideo}
          onClose={handleCloseVideoModal}
          image={selectedImageForVideo}
          onGenerate={handleGenerateVideo}
          generationState={videoGenerationState}
        />
      )}
    </div>
  );
}

export default App;
