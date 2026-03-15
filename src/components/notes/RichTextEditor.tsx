import React, { useRef, useCallback, useState } from 'react';
import { Bold, Italic, Underline, Paintbrush, Type, Highlighter, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  enableImageUpload?: boolean;
}

const TEXT_COLORS = [
  { label: 'Default', value: 'inherit', class: 'bg-foreground' },
  { label: 'Red', value: '#EF4444', class: 'bg-red-500' },
  { label: 'Orange', value: '#F97316', class: 'bg-orange-500' },
  { label: 'Yellow', value: '#EAB308', class: 'bg-yellow-500' },
  { label: 'Green', value: '#22C55E', class: 'bg-green-500' },
  { label: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
  { label: 'Purple', value: '#A855F7', class: 'bg-purple-500' },
  { label: 'Pink', value: '#EC4899', class: 'bg-pink-500' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent', class: 'bg-transparent border border-muted-foreground' },
  { label: 'Yellow', value: '#FEF9C3', class: 'bg-yellow-100' },
  { label: 'Green', value: '#DCFCE7', class: 'bg-green-100' },
  { label: 'Blue', value: '#DBEAFE', class: 'bg-blue-100' },
  { label: 'Purple', value: '#F3E8FF', class: 'bg-purple-100' },
  { label: 'Pink', value: '#FCE7F3', class: 'bg-pink-100' },
  { label: 'Orange', value: '#FFEDD5', class: 'bg-orange-100' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className, enableImageUpload = true }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      
      const { error } = await supabase.storage.from('note-images').upload(fileName, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('note-images').getPublicUrl(fileName);
      
      document.execCommand('insertHTML', false, `<img src="${publicUrl}" alt="note image" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (err: any) {
      console.error('Upload failed:', err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onChange]);

  return (
    <div className="space-y-1">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 rounded-lg border border-input bg-muted/30 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('bold')}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('italic')}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('underline')}
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => execCommand('strikethrough')}
          title="Strikethrough"
        >
          <Type className="w-3.5 h-3.5 line-through" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Text Color">
              <Paintbrush className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Text Color</p>
            <div className="flex gap-1.5 flex-wrap">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => execCommand('foreColor', color.value)}
                  className={cn('w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ring-1 ring-border', color.class)}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Highlight">
              <Highlighter className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Highlight</p>
            <div className="flex gap-1.5 flex-wrap">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => execCommand('hiliteColor', color.value)}
                  className={cn('w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ring-1 ring-border', color.class)}
                  title={color.label}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Image Upload */}
        {enableImageUpload && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Insert Image"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            </Button>
          </>
        )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'overflow-y-auto max-h-[300px]',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground',
          className
        )}
      />
    </div>
  );
};

export default RichTextEditor;
