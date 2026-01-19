import React from 'react';
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

  const docs = [
    { uri: file.url, fileName: file.name }
  ];

  return (
    <div className="h-full w-full bg-white relative overflow-hidden">
      {/* 
        Note: DocViewer often expects a height to be set on container.
        We pass 'style' to the component and also ensure parent is full height.
      */}
      <DocViewer 
        documents={docs} 
        pluginRenderers={DocViewerRenderers} 
        style={{ height: '100%', width: '100%' }}
        config={{
            header: {
                disableHeader: true,
                disableFileName: true,
                retainURLParams: false
            }
        }}
        theme={{
            primary: "#5296d8",
            secondary: "#ffffff",
            tertiary: "#5296d899",
            text_primary: "#000000",
            text_secondary: "#ffffff",
            text_tertiary: "#00000099",
            disableThemeScrollbar: false,
        }}
      />
    </div>
  );
};