import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  fallbackText?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  size = 32,
  className = '',
  fallbackText,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate fallback initials from alt text or fallbackText
  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fallbackInitials = getInitials(alt || fallbackText || 'U');

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        title={alt}
      >
        {fallbackInitials}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        priority={size > 64} // Prioritize larger avatars
      />

      {/* Loading state */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-full animate-pulse"
          style={{ width: size, height: size }}
        >
          <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default Avatar;
