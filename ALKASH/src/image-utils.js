/**
 * Image utility functions for announcements
 * Handles compression, validation, and storage
 */

const STORAGE_KEY = 'announcementImages';
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 900;

/**
 * Compress and convert image to base64
 */
export async function processImage(file) {
    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'File must be an image' };
    }

    if (file.size > MAX_SIZE) {
        return { success: false, error: `Image too large (max ${MAX_SIZE / 1024 / 1024}MB)` };
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round(height * (MAX_WIDTH / width));
                    width = MAX_WIDTH;
                }
                if (height > MAX_HEIGHT) {
                    width = Math.round(width * (MAX_HEIGHT / height));
                    height = MAX_HEIGHT;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL('image/jpeg', 0.85);
                resolve({
                    success: true,
                    base64,
                    width,
                    height,
                    size: base64.length
                });
            };
            img.onerror = () => {
                resolve({ success: false, error: 'Failed to load image' });
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            resolve({ success: false, error: 'Failed to read file' });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Save image to local storage library
 */
export function saveImageToLibrary(base64, name) {
    const library = getImageLibrary();
    const id = `img-${Date.now()}`;
    const entry = {
        id,
        name: name.substring(0, 50),
        data: base64,
        createdAt: new Date().toISOString(),
        usageCount: 0
    };
    library.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    return id;
}

/**
 * Get all images from library
 */
export function getImageLibrary() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

/**
 * Get image from library by ID
 */
export function getImageFromLibrary(id) {
    const library = getImageLibrary();
    return library.find(img => img.id === id);
}

/**
 * Delete image from library
 */
export function deleteImageFromLibrary(id) {
    const library = getImageLibrary().filter(img => img.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

/**
 * Increment usage count
 */
export function incrementImageUsage(id) {
    const library = getImageLibrary();
    const img = library.find(i => i.id === id);
    if (img) {
        img.usageCount = (img.usageCount || 0) + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    }
}
