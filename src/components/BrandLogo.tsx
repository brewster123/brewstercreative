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
    <img
      id="brand-official-logo"
      src="https://cdn.builder.io/api/v1/image/assets%2F48bafc0997de4f0cbe1f0163687e4e1d%2F5f1152145f47462e9c7541115b503221?format=webp&width=800&height=1200"
      alt="Brewster Creative logo"
      className={`shrink-0 block select-none object-contain ${sizeMap[size]} ${className}`}
    />
  );
};

export default BrandLogo;
