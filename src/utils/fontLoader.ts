/**
 * Font loader utility to support Primeform Pro Demo and custom font files
 */

const FONT_STORAGE_KEY = 'cabando_custom_font_data';
const FONT_FAMILY_NAME = 'Primeform Pro Demo';

export const initCustomFont = async () => {
  try {
    const savedFontBase64 = localStorage.getItem(FONT_STORAGE_KEY);
    if (savedFontBase64) {
      const binaryString = window.atob(savedFontBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const font = new FontFace(FONT_FAMILY_NAME, bytes.buffer);
      await font.load();
      document.fonts.add(font);
      document.documentElement.style.setProperty('--font-sans', `"${FONT_FAMILY_NAME}", "Plus Jakarta Sans", sans-serif`);
      document.documentElement.style.setProperty('--font-display', `"${FONT_FAMILY_NAME}", "Syne", sans-serif`);
    }
  } catch (err) {
    console.warn('Could not rehydrate custom font from storage', err);
  }
};

export const loadCustomFontFile = async (file: File): Promise<boolean> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const font = new FontFace(FONT_FAMILY_NAME, arrayBuffer);
    await font.load();
    document.fonts.add(font);
    
    // Save to localStorage if under 5MB
    if (file.size < 5 * 1024 * 1024) {
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = window.btoa(binary);
      localStorage.setItem(FONT_STORAGE_KEY, base64);
    }
    
    document.documentElement.style.setProperty('--font-sans', `"${FONT_FAMILY_NAME}", "Plus Jakarta Sans", sans-serif`);
    document.documentElement.style.setProperty('--font-display', `"${FONT_FAMILY_NAME}", "Syne", sans-serif`);
    return true;
  } catch (err) {
    console.error('Failed to load custom font file', err);
    return false;
  }
};

export const isFontLoaded = (fontName: string = FONT_FAMILY_NAME): boolean => {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    return document.fonts.check(`16px "${fontName}"`);
  }
  return false;
};
