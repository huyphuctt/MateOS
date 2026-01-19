import React, { useMemo } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import { FileItem } from '../../types';

interface DocViewerAppProps {
  file?: FileItem;
}

export const DocViewerApp: React.FC<DocViewerAppProps> = ({ file }) => {
  if (!file) return (
      <div className="h-full w-full bg-[#f3f3f3] dark:bg-[#202020] flex items-center justify-center text-gray-500">
          No file selected
      </div>
  );

  // Memoize the documents array so it doesn't change reference on re-renders (like resizing)
  const docs = useMemo(() => [
    { uri: file.url, fileName: file.name }
  ], [file.url, file.name]);

  // Memoize config to prevent internal re-initialization
  const config = useMemo(() => ({
      header: {
          disableHeader: true,
          disableFileName: true,
          retainURLParams: false
      }
  }), []);

  // Memoize theme
  const theme = useMemo(() => ({
      primary: "#5296d8",
      secondary: "#ffffff",
      tertiary: "#5296d899",
      text_primary: "#000000",
      text_secondary: "#ffffff",
      text_tertiary: "#00000099",
      disableThemeScrollbar: false,
  }), []);

  return (
    <div className="h-full w-full bg-white relative">
      {/* 
        Note: DocViewer often expects a height to be set on container.
        We pass 'style' to the component and also ensure parent is full height.
        Added overflowY: 'auto' to ensure scrolling is enabled.
      */}
      <DocViewer 
        documents={docs} 
        pluginRenderers={DocViewerRenderers} 
        style={{ height: '100%', width: '100%', overflowY: 'auto' }}
        config={config}
        theme={theme}
      />
    </div>
  );
};