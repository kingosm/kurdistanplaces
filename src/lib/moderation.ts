// Singleton model instance
let nsfwModel: any | null = null;

const loadModel = async () => {
    if (nsfwModel) return nsfwModel;
    try {
        console.log("Loading AI moderation libraries on-demand...");
        // Dynamic imports to prevent loading heavy AI libraries on initial page load
        const [nsfwjs, tf] = await Promise.all([
            import('nsfwjs'),
            import('@tensorflow/tfjs')
        ]);

        // Wait for TF to be ready (though nsfwjs usually handles this)
        await tf.ready();

        nsfwModel = await nsfwjs.load();
        return nsfwModel;
    } catch (err) {
        console.error("Failed to load NSFW model:", err);
        return null;
    }
};

const convertGifToJpeg = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Failed to get canvas context"));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name.replace(/\.gif$/i, '.jpg'), { type: 'image/jpeg' });
                        resolve(newFile);
                    } else {
                        reject(new Error("Failed to convert GIF to JPEG"));
                    }
                }, 'image/jpeg', 0.9);
            };
            img.onerror = () => reject(new Error("Failed to load image for conversion"));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
};

export const processImage = async (file: File): Promise<{ safe: boolean, file: File, reason?: string }> => {
    let processedFile = file;

    // 1. Convert GIF to JPEG (First Frame)
    if (file.type === 'image/gif') {
        try {
            console.log("Converting GIF to static JPEG...");
            processedFile = await convertGifToJpeg(file);
        } catch (err) {
            console.error("GIF conversion failed:", err);
            return { safe: false, file, reason: "Failed to process animated image" };
        }
    }

    // 2. Check content (NSFW)
    try {
        const model = await loadModel();
        if (!model) {
            // If model fails (e.g. offline), we allow upload but warn
            console.warn("NSFW model missing, skipping check.");
            return { safe: true, file: processedFile };
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(processedFile);
        img.src = objectUrl;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const predictions = await model.classify(img);
        URL.revokeObjectURL(objectUrl); // Clean up memory

        // Check for NSFW content
        // Classes: Porn, Hentai, Sexy, Neutral, Drawing
        const nsfwScore = predictions.find(p => p.className === 'Porn')?.probability || 0;
        const hentaiScore = predictions.find(p => p.className === 'Hentai')?.probability || 0;

        // Threshold: 0.60 (60%)
        if (nsfwScore > 0.60 || hentaiScore > 0.60) {
            return { safe: false, file: processedFile, reason: "NSFW content detected" };
        }

    } catch (err) {
        console.error("NSFW check failed:", err);
        // Fail open if check crashes
        return { safe: true, file: processedFile };
    }

    return { safe: true, file: processedFile };
};
