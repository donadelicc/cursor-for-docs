/**
 * Modern platform detection utility that avoids deprecated navigator.platform
 */
export const isMacOS = (): boolean => {
  if (typeof navigator === "undefined") return false;

  // Use userAgent detection (reliable and well-supported)
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
};

/**
 * Get the appropriate modifier key for keyboard shortcuts based on platform
 */
export const isModifierPressed = (e: KeyboardEvent): boolean => {
  return isMacOS() ? e.metaKey : e.ctrlKey;
};
