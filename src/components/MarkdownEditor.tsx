import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Download,
  Upload,
  Trash2,
  FileText,
  Eye,
  Edit3,
  Columns,
  Maximize2,
  Minimize2,
  GitBranch,
  Printer
} from 'lucide-react';
import MermaidBlock from './MermaidBlock';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const DEFAULT_MARKDOWN = `# Welcome to MarkView 🚀

MarkView is a simple, high-performance markdown editor with live preview.

## Features
- **Live Preview**: See your changes instantly.
- **GFM Support**: Tables, tasklists, and more.
- **Syntax Highlighting**: Beautiful code blocks.
- **File Management**: Upload and download your .md files.

### Code Example
\`\`\`typescript
function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
}
greet('MarkView User');
\`\`\`

### Task List
- [x] Create a markdown editor
- [x] Add live preview
- [ ] Add cloud sync
- [ ] Add dark mode toggle

### Tables
| Feature | Status |
| :--- | :--- |
| GFM | ✅ |
| Highlighting | ✅ |
| Export | ✅ |

### Mermaid Diagrams
\`\`\`mermaid
graph TD;
    A[Start] --> B{Decision};
    B -->|Yes| C[Do something];
    B -->|No| D[Do something else];
    C --> E[End];
    D --> E;
\`\`\`

> "Markdown is a text-to-HTML conversion tool for web writers." - John Gruber
`;

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
  };

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const selectedText = text.substring(start, end);
    const textToInsert = before + selectedText + after;
    
    // Use execCommand to preserve undo/redo history
    // This is the most reliable way to maintain the browser's undo stack for a textarea
    try {
      document.execCommand('insertText', false, textToInsert);
    } catch (e) {
      // Fallback if execCommand fails
      const newText = text.substring(0, start) + textToInsert + text.substring(end);
      setMarkdown(newText);
    }
    
    // If nothing was selected, place cursor between before and after
    if (start === end) {
      const newPos = start + before.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMarkdown(content);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      insertText(`![${file.name}](${base64})`, '');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    const previewEl = document.querySelector('.markdown-body');
    if (!previewEl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = previewEl.innerHTML;
    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>MarkView Export</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.7; }
  h1 { font-size: 2em; font-weight: 700; margin: 1.5em 0 0.5em; padding-bottom: 0.3em; border-bottom: 1px solid #e5e5e5; }
  h2 { font-size: 1.5em; font-weight: 600; margin: 1.2em 0 0.4em; padding-bottom: 0.2em; border-bottom: 1px solid #e5e5e5; }
  h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.4em; }
  p { margin: 1em 0; }
  ul, ol { margin: 1em 0; padding-left: 2em; }
  li { margin: 0.25em 0; }
  blockquote { padding-left: 1em; border-left: 4px solid #d1d5db; font-style: italic; color: #6b7280; margin: 1em 0; }
  code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; background: #f3f4f6; padding: 0.15em 0.4em; border-radius: 4px; }
  pre { background: #f3f4f6; padding: 1em; border-radius: 8px; margin: 1em 0; overflow-x: auto; }
  pre code { background: transparent; padding: 0; }
  table { width: 100%; border-collapse: collapse; margin: 1em 0; }
  th, td { padding: 0.5em; border: 1px solid #e5e5e5; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; }
  img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0; }
  a { color: #2563eb; text-decoration: underline; }
  hr { margin: 2em 0; border: none; border-top: 1px solid #e5e5e5; }
  svg { max-width: 100%; height: auto; }
  @media print { body { padding: 0; } }
</style></head><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  const clearEditor = () => {
    if (window.confirm('Are you sure you want to clear the editor? This action cannot be undone.')) {
      setMarkdown('');
    }
  };

  return (
    <TooltipProvider>
        <div className={cn(
          "flex flex-col h-screen bg-background text-foreground transition-all duration-300",
          isFullscreen ? "fixed inset-0 z-[100] w-screen h-screen" : "relative"
        )}>
        {/* Header / Toolbar */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold text-lg hidden sm:block tracking-tight">MarkView</h1>
            </div>
            
            <Separator orientation="vertical" className="h-6 mx-2" />
            
            <div className="flex items-center gap-1">
              <ToolbarButton onClick={() => insertText('**', '**')} icon={<Bold size={18} />} tooltip="Bold" />
              <ToolbarButton onClick={() => insertText('_', '_')} icon={<Italic size={18} />} tooltip="Italic" />
              <ToolbarButton onClick={() => insertText('\n- ')} icon={<List size={18} />} tooltip="Bullet List" />
              <ToolbarButton onClick={() => insertText('\n1. ')} icon={<ListOrdered size={18} />} tooltip="Numbered List" />
              <ToolbarButton onClick={() => insertText('\n> ')} icon={<Quote size={18} />} tooltip="Quote" />
              <ToolbarButton onClick={() => insertText('`', '`')} icon={<Code size={18} />} tooltip="Inline Code" />
              <ToolbarButton onClick={() => imageInputRef.current?.click()} icon={<ImageIcon size={18} />} tooltip="Insert Image" />
              <ToolbarButton onClick={() => insertText('[', '](https://)')} icon={<LinkIcon size={18} />} tooltip="Link" />
              <ToolbarButton onClick={() => insertText('\n```mermaid\ngraph TD;\n    A-->B;\n', '```\n')} icon={<GitBranch size={18} />} tooltip="Mermaid Diagram" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-muted rounded-lg p-1 mr-2">
              <Button 
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('edit')}
                className="h-8 px-3"
              >
                <Edit3 size={16} className="mr-2" /> Edit
              </Button>
              <Button 
                variant={viewMode === 'split' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('split')}
                className="h-8 px-3"
              >
                <Columns size={16} className="mr-2" /> Split
              </Button>
              <Button 
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('preview')}
                className="h-8 px-3"
              >
                <Eye size={16} className="mr-2" /> Preview
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />

            <div className="flex items-center gap-1">
              <ToolbarButton onClick={() => fileInputRef.current?.click()} icon={<Upload size={18} />} tooltip="Upload File" />
              <ToolbarButton onClick={handleDownload} icon={<Download size={18} />} tooltip="Download .md" />
              <ToolbarButton onClick={handlePrintPDF} icon={<Printer size={18} />} tooltip="Print PDF" />
              <ToolbarButton onClick={clearEditor} icon={<Trash2 size={18} />} tooltip="Clear Editor" variant="destructive" />
              <ToolbarButton 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />} 
                tooltip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} 
              />
            </div>
          </div>
        </header>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".md,.txt" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={imageInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Mobile Tabs */}
          <div className="md:hidden w-full border-b border-border">
            <Tabs defaultValue="edit" className="w-full" onValueChange={(v) => setViewMode(v as any)}>
              <TabsList className="w-full justify-start h-12 rounded-none bg-transparent px-4">
                <TabsTrigger value="edit" className="data-[state=active]:bg-muted">Edit</TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-muted">Preview</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Editor Pane */}
          <AnimatePresence mode="wait">
            {(viewMode === 'edit' || viewMode === 'split') && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "flex-1 flex flex-col border-r border-border bg-card min-h-0",
                  viewMode === 'edit' ? "w-full" : "w-1/2"
                )}
              >
                <div className="flex items-center justify-between px-4 py-1 bg-muted/30 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
                  <span>Editor</span>
                  <span>Markdown</span>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={markdown}
                  onChange={handleMarkdownChange}
                  placeholder="Type your markdown here..."
                  className="flex-1 resize-none border-none focus-visible:ring-0 rounded-none p-6 font-mono text-sm leading-relaxed bg-transparent"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Pane */}
          <AnimatePresence mode="wait">
            {(viewMode === 'preview' || viewMode === 'split') && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "flex-1 flex flex-col bg-background min-h-0",
                  viewMode === 'preview' ? "w-full" : "w-1/2"
                )}
              >
                <div className="flex items-center justify-between px-4 py-1 bg-muted/30 text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
                  <span>Preview</span>
                  <span>Live</span>
                </div>
                <ScrollArea className="flex-1 h-full">
                  <div className="p-4 md:p-6 markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        pre({ children, ...props }) {
                          const child = React.Children.toArray(children)[0];
                          if (React.isValidElement(child)) {
                            const childProps = child.props as { className?: string; children?: React.ReactNode };
                            if (childProps.className?.includes('language-mermaid')) {
                              const chart = typeof childProps.children === 'string'
                                ? childProps.children
                                : String(childProps.children ?? '');
                              return <MermaidBlock chart={chart} />;
                            }
                          }
                          return <pre {...props}>{children}</pre>;
                        },
                      }}
                    >
                      {markdown || '*No content to preview*'}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="px-4 py-1 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Words: {markdown.trim() ? markdown.trim().split(/\s+/).length : 0}</span>
            <span>Characters: {markdown.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Sync
            </span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({ 
  onClick, 
  icon, 
  tooltip, 
  variant = "ghost" 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  tooltip: string;
  variant?: "ghost" | "destructive";
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button 
            variant={variant} 
            size="icon" 
            onClick={onClick} 
            className={cn("h-8 w-8", variant === "destructive" && "hover:bg-destructive/10 hover:text-destructive")}
          >
            {icon}
          </Button>
        }
      />
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
