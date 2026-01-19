import React, { useMemo, useState, useEffect } from 'react';
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import ReactMarkdown from 'react-markdown';
import { FileItem } from '../../types';

interface DocViewerAppProps {
  file?: FileItem;
}

export const DocViewerApp: React.FC<DocViewerAppProps> = ({ file }) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');

  useEffect(() => {
    if (file?.type === 'markdown' && file.url) {
        // Fetch content. Supports Data URIs and real URLs
        fetch(file.url)
            .then(res => res.text())
            .then(text => setMarkdownContent(text))
            .catch(err => console.error("Failed to load markdown:", err));
    }
  }, [file]);

  // Memoize the documents array so it doesn't change reference on re-renders
  const docs = useMemo(() => (file ? [
    { uri: file.url, fileName: file.name }
  ] : []), [file?.url, file?.name]);

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

  if (!file) return (
      <div className="h-full w-full bg-[#f3f3f3] dark:bg-[#202020] flex items-center justify-center text-gray-500">
          No file selected
      </div>
  );

  // PDF Viewer using native embed
  if (file.type === 'pdf') {
      return (
        <div className="h-full w-full bg-gray-200 dark:bg-gray-800 flex flex-col">
            <embed 
                src={file.url} 
                type="application/pdf" 
                className="w-full h-full border-none"
            />
        </div>
      );
  }

  // Markdown Viewer
  if (file.type === 'markdown') {
      return (
        <div className="h-full w-full bg-white relative overflow-y-auto">
             <div className="max-w-4xl mx-auto p-8 lg:p-12">
                <article className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown>{markdownContent}</ReactMarkdown>
                </article>
             </div>
        </div>
      );
  }

  // Standard DocViewer for other formats (Word, Excel, etc.)
  return (
    <div className="h-full w-full bg-white relative">
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