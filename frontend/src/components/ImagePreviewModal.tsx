import React from 'react';
import Image from 'next/image';
import { UploadedImage } from './KnowledgeBase';

interface ImagePreviewModalProps {
  image: UploadedImage | null;
  onClose: () => void;
  onInsert: (imageDataUrl: string, imageName: string) => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  image,
  onClose,
}) => {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div className="relative max-w-6xl max-h-full">
        {/* Close button - positioned absolutely over the image */}
        <button
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 hover:scale-110"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image - takes up the full modal space */}
        <Image
          src={image.dataUrl}
          alt={image.name}
          width={1200}
          height={800}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          unoptimized
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;