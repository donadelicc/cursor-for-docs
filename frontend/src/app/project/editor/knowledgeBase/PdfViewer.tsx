import React from 'react';

interface PdfViewerProps {
  file?: File;
  url?: string;
  title?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, url: urlProp, title }) => {
  const [url, setUrl] = React.useState<string | null>(urlProp || null);

  React.useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  React.useEffect(() => {
    if (urlProp) setUrl(urlProp);
  }, [urlProp]);

  if (!url) return null;

  return (
    <iframe
      src={url}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title={title || file?.name || 'PDF'}
    />
  );
};

export default PdfViewer;
