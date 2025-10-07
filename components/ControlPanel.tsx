
import React from 'react';
import type { ProductConfig, ImageFile } from '../types';
import { LIGHTING_OPTIONS, ACTION_POSE_IDEAS, ASPECT_RATIOS, BACKGROUND_IDEAS } from '../constants';
import { UploadIcon } from './icons/UploadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ControlPanelProps {
  products: ProductConfig[];
  onAddProduct: () => void;
  onRemoveProduct: (id: string) => void;
  onUpdateProduct: (id: string, updatedConfig: Partial<ProductConfig>) => void;
  
  faceReference: ImageFile | null;
  setFaceReference: React.Dispatch<React.SetStateAction<ImageFile | null>>;
  
  lighting: string;
  setLighting: (lighting: string) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  resolution: string;
  setResolution: (res: string) => void;
  gender: 'female' | 'male';
  setGender: (gender: 'female' | 'male') => void;
  negativePrompt: string;
  setNegativePrompt: (prompt: string) => void;
  
  onGenerate: (productIds: string[]) => void;
  isLoading: boolean;
}

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-600 block">{label}</label>
    {children}
  </div>
);

const IdeaButtons: React.FC<{
    ideas: {label: string, value: string}[];
    onClick: (value: string) => void;
}> = ({ ideas, onClick }) => (
    <div className="flex flex-wrap gap-2 mb-2">
        {ideas.map(idea => (
            <button
                key={idea.label}
                onClick={() => onClick(idea.value)}
                className="px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded-full hover:bg-purple-100 hover:border-purple-400 transition-colors"
                type="button"
            >
                {idea.label}
            </button>
        ))}
    </div>
);


const FileInput: React.FC<{
  id: string;
  label: string;
  fileData: ImageFile | null;
  onFileChange: (file: ImageFile | null) => void;
}> = ({ id, label, fileData, onFileChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange({ file, preview: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="cursor-pointer">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors bg-white hover:bg-purple-50">
          {fileData ? (
            <img src={fileData.preview} alt="Pratinjau" className="mx-auto h-24 w-24 object-cover rounded-md" />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 text-gray-500 h-24">
              <UploadIcon />
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs">PNG, JPG</span>
            </div>
          )}
        </div>
      </label>
      <input id={id} type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
    </div>
  );
};

const Checkbox: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, checked, onChange }) => (
  <div className="flex items-center justify-center">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 transition"
    />
    <label htmlFor={id} className="ml-2 block text-sm text-gray-700 font-medium">
      {label}
    </label>
  </div>
);

const ProductControlCard: React.FC<{
    product: ProductConfig;
    index: number;
    onUpdate: (id: string, updatedConfig: Partial<ProductConfig>) => void;
    onRemove: (id: string) => void;
}> = ({ product, index, onUpdate, onRemove }) => {

    const handleFileChange = (file: ImageFile | null) => {
        onUpdate(product.id, { outfitReference: file });
    };

    const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdate(product.id, { [name]: value });
    };
    
    const handleCheckboxChange = (shot: 'ugc1' | 'ugc2' | 'broll' | 'productOnly') => {
        onUpdate(product.id, { 
            shotsToGenerate: {
                ...product.shotsToGenerate,
                [shot]: !product.shotsToGenerate[shot]
            }
        });
    };

    return (
        <div className="p-4 border border-gray-300 rounded-lg space-y-4 bg-gray-50/50">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">Produk {index + 1}</h4>
                <button 
                    onClick={() => onRemove(product.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                    type="button"
                >
                    Hapus
                </button>
            </div>
            
            <FileInput 
                id={`outfit-ref-${product.id}`} 
                label="Referensi Pakaian" 
                fileData={product.outfitReference} 
                onFileChange={handleFileChange} 
            />
            
            <InputGroup label="Deskripsi Latar Belakang">
                <IdeaButtons 
                    ideas={BACKGROUND_IDEAS} 
                    onClick={(value) => onUpdate(product.id, { background: value })}
                />
                <textarea name="background" placeholder="Pilih atau tulis deskripsi..." value={product.background} onChange={handleConfigChange} rows={3} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" />
            </InputGroup>

            <InputGroup label="Pose & Aksi (UGC 1)">
                <IdeaButtons 
                    ideas={ACTION_POSE_IDEAS} 
                    onClick={(value) => onUpdate(product.id, { pose1: value })}
                />
                <textarea name="pose1" placeholder="Pilih atau tulis deskripsi..." value={product.pose1} onChange={handleConfigChange} rows={3} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" />
            </InputGroup>

             <InputGroup label="Pose & Aksi (UGC 2)">
                <IdeaButtons 
                    ideas={ACTION_POSE_IDEAS} 
                    onClick={(value) => onUpdate(product.id, { pose2: value })}
                />
                <textarea name="pose2" placeholder="Pilih atau tulis deskripsi..." value={product.pose2} onChange={handleConfigChange} rows={3} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" />
            </InputGroup>

             <InputGroup label="Pilih Jenis Foto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-gray-200">
                    <Checkbox id={`ugc1-${product.id}`} label="UGC 1" checked={product.shotsToGenerate.ugc1} onChange={() => handleCheckboxChange('ugc1')} />
                    <Checkbox id={`ugc2-${product.id}`} label="UGC 2" checked={product.shotsToGenerate.ugc2} onChange={() => handleCheckboxChange('ugc2')} />
                    <Checkbox id={`broll-${product.id}`} label="B-Roll" checked={product.shotsToGenerate.broll} onChange={() => handleCheckboxChange('broll')} />
                    <Checkbox id={`productOnly-${product.id}`} label="Fokus Produk" checked={product.shotsToGenerate.productOnly} onChange={() => handleCheckboxChange('productOnly')} />
                </div>
            </InputGroup>
        </div>
    );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  products,
  onAddProduct,
  onRemoveProduct,
  onUpdateProduct,
  faceReference,
  setFaceReference,
  lighting,
  setLighting,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  gender,
  setGender,
  negativePrompt,
  setNegativePrompt,
  onGenerate,
  isLoading,
}) => {
  
  const productsWithSettings = products.filter(p => p.outfitReference && Object.values(p.shotsToGenerate).some(Boolean));
  const isGenerateDisabled = isLoading || !faceReference || productsWithSettings.length === 0;
  const buttonText = productsWithSettings.length > 0 ? `Hasilkan ${productsWithSettings.length} Produk` : 'Siapkan Produk';

  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-gray-200 shadow-lg space-y-6 sticky top-24">
      
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Pengaturan Global</h3>
        <p className="text-sm text-gray-600 -mt-4">Pengaturan ini berlaku untuk semua produk yang akan dibuat.</p>
        <div className="grid grid-cols-2 gap-4">
            <FileInput id="face-ref" label="Referensi Wajah" fileData={faceReference} onFileChange={setFaceReference} />
             <InputGroup label="Gender Model">
              <select
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'female' | 'male')}
                className="w-full h-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              >
                <option value="female">Perempuan</option>
                <option value="male">Laki-laki</option>
              </select>
            </InputGroup>
        </div>
        
        <InputGroup label="Pencahayaan">
            <select name="lighting" value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                {LIGHTING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </InputGroup>

        <InputGroup label="Rasio Aspek (Untuk Semua Foto)">
          <select name="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
            {ASPECT_RATIOS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </InputGroup>
        
        <InputGroup label="Resolusi Gambar">
          <select 
            name="resolution" 
            value={resolution} 
            onChange={(e) => setResolution(e.target.value)} 
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          >
            <option value="standard">Standar</option>
            <option value="high">Tinggi (Lebih Lambat)</option>
          </select>
        </InputGroup>

        <InputGroup label="Prompt Negatif">
          <textarea 
            name="negativePrompt" 
            value={negativePrompt} 
            onChange={(e) => setNegativePrompt(e.target.value)} 
            rows={3}
            placeholder="e.g., deformed, blurry, watermark..."
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          />
        </InputGroup>
      </div>

      <hr className="border-gray-200" />
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Kontrol Produk</h3>
        {products.map((p, i) => (
            <ProductControlCard
                key={p.id}
                product={p}
                index={i}
                onUpdate={onUpdateProduct}
                onRemove={onRemoveProduct}
            />
        ))}
        {products.length < 8 && (
            <button 
                onClick={onAddProduct}
                type="button"
                className="w-full border-2 border-dashed border-gray-400 text-gray-600 font-bold py-3 px-4 rounded-lg hover:bg-purple-50 hover:border-purple-500 transition-all duration-300"
            >
                + Tambah Produk
            </button>
        )}
      </div>

      <button 
        onClick={() => onGenerate(productsWithSettings.map(p => p.id))}
        disabled={isGenerateDisabled}
        className="w-full flex items-center justify-center bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95"
      >
        {isLoading ? <SpinnerIcon /> : buttonText}
      </button>
    </div>
  );
};
