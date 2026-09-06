import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Brewster Creative — Official Logo Mark
 *
 * Renders the exact paths from the official `Asset 3.svg` (also preserved,
 * unmodified, at /public/assets/brand/Asset_3.svg for reference). The path
 * data, viewBox, and fill color below are copied verbatim from that file —
 * nothing has been redrawn, simplified, or re-traced. Only the wrapping
 * <svg> width/height (via the existing `size` prop) is controlled by this
 * component, so the mark scales without ever distorting its proportions
 * (the viewBox is square, and width/height always change together).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <svg
      id="brand-official-logo"
      role="img"
      aria-label="Brewster Creative logo"
      viewBox="0 0 154 154"
      className={`shrink-0 block select-none ${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="#141416">
        <path d="M84,84h-28l-14,14v-56l42,42Z" />
        <path d="M112,56.77v40c0,8.29-6.72,15-15,15-18.33.08-36.67.15-55,.23l14-14c12.33-.08,24.67-.15,37-.23,2.76,0,5-2.24,5-5v-3.77c0-2.76-2.24-5-5-5h-9v-14h9c2.76,0,5-2.24,5-5v-4.23c0-2.76-2.24-5-5-5h-23l-14-14h41c8.28,0,15,6.72,15,15Z" />
        <path d="M147.47,45.92l-14.83,8.9c2.74,6.86,4.25,14.34,4.25,22.18s-1.47,15.15-4.16,21.95l14.87,8.83c4.12-9.43,6.4-19.84,6.4-30.78s-2.33-21.57-6.53-31.08ZM77,136.89c-33.07,0-59.89-26.82-59.89-59.89s26.82-59.89,59.89-59.89c20.84,0,39.2,10.65,49.92,26.8l14.63-8.89C127.82,13.94,104.03,0,77,0,34.48,0,0,34.48,0,77s34.48,77,77,77c26.88,0,50.54-13.77,64.31-34.65l-14.57-8.98c-10.75,15.99-29.02,26.52-49.74,26.52Z" />
      </g>
    </svg>
  );
};

export default BrandLogo;

