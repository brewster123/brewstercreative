import React from 'react';

interface ArtworkHoverWaveProps {
  /** Optional additional z-index or positioning classes */
  className?: string;
}

/**
 * Pure CSS compositor-accelerated light-wave sweep hover overlay.
 * Remains invisible at rest and sweeps smoothly across artwork on parent `.group:hover`.
 */
export const ArtworkHoverWave: React.FC<ArtworkHoverWaveProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-300 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 ${className}`}
    >
      <div className="artwork-wave-sheen" />
    </div>
  );
};
