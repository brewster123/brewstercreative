import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Brewster Creative Official Vector Monogram
 * Vector paths from Asset 3.svg
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <svg 
      id="brand-official-logo"
      viewBox="0 0 137.91 137.91" 
      className={`shrink-0 block select-none text-zinc-950 ${sizeMap[size]} ${className}`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Right arc */}
      <path d="m137.91,68.95c0,11.53-2.88,22.38-7.94,31.91l-14.73-8.5c3.55-6.95,5.56-14.9,5.56-23.41s-2.01-16.36-5.56-23.31l14.73-8.5c5.06,9.43,7.94,20.28,7.94,31.82Z" />
      {/* Outer circle track */}
      <path d="m115.24,109.36l-14.73-8.5c-8.84,10.61-22.16,17.44-37.13,17.44-26.69,0-48.33-21.64-48.33-48.33S36.69,21.64,63.38,21.64c14.87,0,28.29,6.72,37.13,17.44l14.73-8.5C103.1,15.63,84.7,5.01,63.38,5.01,27.5,5.01-1.63,34.14-1.63,70.02s29.13,65.01,65.01,65.01c21.32,0,40.61-10.72,51.86-25.68Z" />
      {/* Central geometric facets */}
      <polygon points="36.03 36.94 74.07 74.98 36.03 74.98 36.03 36.94" />
      <path d="m49.33,36.94h39.46c6.01,0,10.88,4.87,10.88,10.88s-4.87,10.88-10.88,10.88h-11.43v16.29h11.43c6.01,0,10.88,4.87,10.88,10.88s-4.87,10.88-10.88,10.88h-39.46l-13.31,13.31h52.76c13.36,0,24.19-10.83,24.19-24.19,0-7.39-3.32-14-8.55-18.47,5.23-4.47,8.55-11.08,8.55-18.47,0-13.36-10.83-24.19-24.19-24.19h-52.76l13.31,13.31Z" />
      <polygon points="36.03 87.89 48.74 75.18 36.03 75.18 36.03 87.89" />
    </svg>
  );
};

export default BrandLogo;
