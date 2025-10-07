
import { GoogleGenAI, Modality } from "@google/genai";
import type { GeneratedImage } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const generateCreativeAssets = async (ai: GoogleGenAI, outfitPart: { inlineData: { data: string, mimeType: string } }) => {
    const masterPrompt = `
    Anda adalah seorang content strategist TikTok yang handal. Tugas Anda adalah membuat aset kreatif untuk kampanye fashion berdasarkan gambar pakaian yang diberikan.
    
    **Tugas Utama:**
    1.  **Analisis Gambar:** Lihat dengan saksama gambar pakaian yang saya berikan.
    2.  **Identifikasi Produk:** Tentukan item fashion utama dalam gambar (misalnya: kemeja flanel, gaun musim panas, sepatu bot kulit, jaket hujan tahan air).
    3.  **Buat Aset:** Untuk tiga adegan video (UGC, B-Roll, Fokus Produk), buatlah:
        *   **Saran Gerakan Video:** Satu kalimat singkat yang menggambarkan aksi model.
        *   **Skrip Voice Over:** Narasi singkat (5-7 detik) yang berfokus **HANYA PADA PRODUK** yang Anda identifikasi.

    **Struktur Narasi Voice Over:**
    Skrip harus mengalir sebagai cerita pendek yang membangun minat pada produk dari adegan 1 hingga 3.
    *   **Adegan 1 (UGC):** Perkenalkan produk dan kesan pertama. Contoh: "Suka banget sama kemeja flanel ini, bahannya adem dan nyaman banget."
    *   **Adegan 2 (B-Roll):** Sorot keunggulan atau detail unik. Contoh: "Motif kotaknya klasik, tapi warnanya bikin look-nya jadi modern."
    *   **Adegan 3 (Fokus Produk):** Berikan kesimpulan dan Call to Action (CTA) yang kuat. Contoh: "Ini item wajib punya buat hangout. Buruan cek keranjang kuning!"

    FORMAT OUTPUT HARUS BERBENTUK JSON. Jangan tambahkan markdown \`\`\`json atau teks lainnya.

    Struktur JSON yang wajib diikuti:
    {
      "ugc": {
        "video_suggestion": "Gerakan video singkat dan sederhana untuk adegan UGC.",
        "voice_over_script": "Skrip voice over 5-7 detik untuk adegan UGC, fokus pada produk di gambar."
      },
      "broll": {
        "video_suggestion": "Gerakan video sinematik singkat untuk adegan B-Roll.",
        "voice_over_script": "Skrip voice over 5-7 detik, melanjutkan narasi tentang keunggulan produk."
      },
      "product": {
        "video_suggestion": "Gerakan video close-up untuk adegan fokus produk.",
        "voice_over_script": "Skrip voice over 5-7 detik, puncak narasi dengan CTA."
      }
    }

    **Aturan Paling Penting:**
    - **FOKUS PADA PRODUK:** Skrip voice over **HARUS 100%** membahas item fashion spesifik dari gambar. Jangan membahas latar, pose, atau hal lain di luar produk itu sendiri. Jika gambar adalah sepatu, bicarakan tentang sepatu itu.
    - **SPESIFIK:** Sebutkan jenis produknya jika bisa (misal: 'kemeja flanel' bukan cuma 'baju').
    - **RINGKAS:** Jaga agar setiap bagian tetap singkat dan langsung ke intinya.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [outfitPart, { text: masterPrompt }] },
        config: {
            responseMimeType: "application/json",
        },
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse creative assets JSON:", response.text);
        throw new Error("Gagal memproses narasi kreatif dari AI.");
    }
};

type ShotType = 'UGC_1' | 'UGC_2' | 'B_ROLL' | 'PRODUCT_ONLY';

export const generateFashionShots = async (
  background: string,
  poses: { ugc1: string, ugc2: string },
  lighting: string,
  faceFile: File,
  outfitFile: File,
  typesToGenerate: ShotType[],
  aspectRatio: string,
  resolution: string,
  gender: 'female' | 'male',
  negativePrompt: string
): Promise<PromiseSettledResult<GeneratedImage>[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const facePart = await fileToGenerativePart(faceFile);
    const outfitPart = await fileToGenerativePart(outfitFile);
    
    const negativePromptInstruction = negativePrompt.trim() ? ` Hindari hal-hal berikut: ${negativePrompt}.` : '';
    const highResPrompt = resolution === 'high' ? 'Resolusi sangat tinggi, 8k, detail tajam, kualitas majalah fashion.' : 'Resolusi standar, kualitas bagus untuk media sosial.';
    
    const subject = gender === 'male' ? 'Seorang pria' : 'Seorang wanita';
    const basePrompt = (pose: string) => `${subject} dengan wajah dari gambar referensi pertama, mengenakan pakaian dari gambar referensi kedua. Dia sedang ${pose} dengan latar ${background}. Pencahayaan adalah ${lighting}. Rasio aspek foto adalah ${aspectRatio}. ${highResPrompt}.${negativePromptInstruction}`;

    const ugc1Prompt = `${basePrompt(poses.ugc1)} Gaya foto harus terlihat seperti UGC (User-Generated Content) yang otentik dan candid. Ambil foto seluruh badan.`;
    const ugc2Prompt = `${basePrompt(poses.ugc2)} Gaya foto harus terlihat seperti UGC (User-Generated Content) yang otentik dan candid. Ambil foto seluruh badan.`;
    const brollPrompt = `Gaya foto harus sangat sinematik dan artistik, seperti potongan adegan dari film fashion. Fokus pada interaksi antara model, pakaian, dan suasana lingkungan untuk menciptakan mood yang kuat. Gunakan sudut pengambilan gambar yang tidak biasa atau komposisi yang dinamis. Ini adalah B-Roll, jadi hindari pose yang menghadap langsung ke kamera. Tujuannya adalah untuk menangkap esensi dan cerita dari pakaian tersebut. Ambil foto medium shot atau full body shot yang kreatif. ${basePrompt(poses.ugc1)}`; // B-Roll can use the first pose as a base
    const productPrompt = `Ini adalah foto FOKUS PRODUK. Tampilkan HANYA item pakaian utama dari gambar referensi kedua. JANGAN tampilkan model atau manusia. Atur pakaian dengan gaya (seperti flat lay atau digantung dengan indah) di atas latar belakang yang estetik dan minimalis yang bervariasi setiap kali dibuat. Contoh latar belakang: permukaan marmer, linen bertekstur, beton poles, atau latar belakang warna solid yang lembut. Fokus utama adalah pada detail, tekstur, dan kualitas produk itu sendiri dalam presentasi yang bersih dan seperti katalog. Ambil foto close-up atau medium shot pada produk. Rasio aspek foto adalah ${aspectRatio}. ${highResPrompt}.${negativePromptInstruction}`;

    const prompts: Record<ShotType, string> = {
        UGC_1: ugc1Prompt,
        UGC_2: ugc2Prompt,
        B_ROLL: brollPrompt,
        PRODUCT_ONLY: productPrompt,
    };
    
    type PartialGeneratedImage = Omit<GeneratedImage, 'videoMovementSuggestion' | 'voiceOverScript'>;

    const generateImage = async (shotType: ShotType): Promise<PartialGeneratedImage> => {
        const prompt = prompts[shotType];
        
        const parts = shotType === 'PRODUCT_ONLY' ? [outfitPart, { text: prompt }] : [facePart, outfitPart, { text: prompt }];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (!imagePart || !imagePart.inlineData) {
            throw new Error(`Tidak ada gambar yang dihasilkan untuk ${shotType}.`);
        }
        
        return {
            base64: imagePart.inlineData.data,
            prompt,
            shotType,
        };
    };

    const imageGenerationPromises = typesToGenerate.map(type => generateImage(type));
    const imageResults = await Promise.allSettled(imageGenerationPromises);
    
    const successfulGenerations = imageResults.filter(r => r.status === 'fulfilled');
    if (successfulGenerations.length === 0) {
        return imageResults as PromiseSettledResult<GeneratedImage>[];
    }
    
    try {
        const creativeAssets = await generateCreativeAssets(ai, outfitPart);

        const assetsMap = {
            UGC_1: creativeAssets.ugc,
            UGC_2: creativeAssets.ugc, // UGC 2 reuses UGC 1's creative assets
            B_ROLL: creativeAssets.broll,
            PRODUCT_ONLY: creativeAssets.product,
        };

        const finalResults = imageResults.map(result => {
            if (result.status === 'fulfilled') {
                const partialImage = result.value;
                const assets = assetsMap[partialImage.shotType as ShotType];
                
                if (!assets) {
                    return { 
                        status: 'rejected' as const, 
                        reason: new Error(`Aset kreatif tidak ditemukan untuk ${partialImage.shotType}`) 
                    };
                }
                
                const fullImage: GeneratedImage = {
                    ...partialImage,
                    videoMovementSuggestion: assets.video_suggestion,
                    voiceOverScript: assets.voice_over_script,
                };
                return { status: 'fulfilled' as const, value: fullImage };
            }
            return result;
        });

        return finalResults;
    } catch(e) {
        console.error("Creative assets generation failed, returning images only.", e);
        return imageResults.map(result => {
            if (result.status === 'fulfilled') {
                const partialImage = result.value;
                 const fullImage: GeneratedImage = {
                    ...partialImage,
                    videoMovementSuggestion: 'N/A',
                    voiceOverScript: 'N/A',
                };
                return { status: 'fulfilled' as const, value: fullImage };
            }
            return result;
        }) as PromiseSettledResult<GeneratedImage>[];
    }
};

export const generateVideo = async (
    prompt: string,
    base64Image: string,
    onProgress: (message: string) => void
): Promise<string> => {
    onProgress('Menginisialisasi generator video...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    onProgress('Mengirim permintaan pembuatan video...');
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: base64Image,
            mimeType: 'image/jpeg',
        },
        config: {
            numberOfVideos: 1
        }
    });
    
    onProgress('Video sedang dalam antrean untuk diproses...');
    let checks = 0;
    while (!operation.done) {
        checks++;
        await new Promise(resolve => setTimeout(resolve, 10000)); 
        const timeElapsed = checks * 10;
        onProgress(`Memeriksa status video... (${timeElapsed} detik berlalu)`);
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress('Video berhasil dibuat! Mengunduh data...');
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Gagal mendapatkan tautan unduhan video dari API.');
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY!}`);
    if (!response.ok) {
        throw new Error(`Gagal mengunduh video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    onProgress('Selesai!');
    return videoUrl;
};
