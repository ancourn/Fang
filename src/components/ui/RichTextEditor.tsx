"use client";

import { useState, useCallback, useRef } from "react";
import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CodeToggle,
  CreateLink,
  InsertImage,
  ListsToggle,
  ShowSandpackInfo,
  InsertTable,
  InsertThematicBreak
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Link, 
  Image, 
  Table,
  Hash,
  Minus,
  Smile,
  AtSign
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  readonly?: boolean;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start typing...",
  minHeight = "200px",
  maxHeight = "500px",
  readonly = false,
  className = ""
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const insertMarkdown = useCallback((markdown: string) => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newValue = before + markdown + after;
      
      onChange(newValue);
      
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.selectionStart = start + markdown.length;
        textarea.selectionEnd = start + markdown.length;
        textarea.focus();
      }, 0);
    }
  }, [onChange]);

  const wrapSelection = useCallback((before: string, after: string = before) => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);
      const replacement = before + selectedText + after;
      const newValue = text.substring(0, start) + replacement + text.substring(end);
      
      onChange(newValue);
      
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.selectionStart = start + replacement.length;
        textarea.selectionEnd = start + replacement.length;
        textarea.focus();
      }, 0);
    }
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) {
      const textarea = editorRef.current?.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end) || "Link text";
        const markdown = `[${selectedText}](${url})`;
        const newValue = text.substring(0, start) + markdown + text.substring(end);
        
        onChange(newValue);
        
        setTimeout(() => {
          textarea.focus();
        }, 0);
      }
    }
  }, [onChange]);

  const insertMention = useCallback(() => {
    const mention = prompt("Enter @username:");
    if (mention) {
      wrapSelection(`@${mention} `);
    }
  }, [wrapSelection]);

  const insertEmoji = useCallback(() => {
    const emoji = prompt("Enter emoji (e.g., 😊, 👍, ❤️):");
    if (emoji) {
      insertMarkdown(emoji);
    }
  }, [insertMarkdown]);

  const FormattingToolbar = () => (
    <div className="flex items-center gap-1 p-2 border-b bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => wrapSelection("**", "**")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => wrapSelection("*", "*")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => wrapSelection("__", "__")}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => wrapSelection("`", "`")}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("\n- ")}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("\n1. ")}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => wrapSelection("> ")}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={insertLink}
        title="Insert Link"
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("![Image](url)")}
        title="Insert Image"
      >
        <Image className="h-4 w-4" alt="" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |")}
        title="Insert Table"
      >
        <Table className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => wrapSelection("# ")}
        title="Heading"
      >
        <Hash className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertMarkdown("\n---\n")}
        title="Horizontal Rule"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={insertMention}
        title="Mention User"
      >
        <AtSign className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={insertEmoji}
        title="Insert Emoji"
      >
        <Smile className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <FormattingToolbar />
      <div 
        ref={editorRef}
        className="relative"
        style={{ minHeight, maxHeight }}
      >
        <MDXEditor
          markdown={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readonly}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin(),
            tablePlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <div className="hidden">
                  {/* Hidden toolbar as we use custom formatting toolbar */}
                </div>
              )
            })
          ]}
          className={`min-h-[${minHeight}] max-h-[${maxHeight}] ${isFocused ? 'ring-2 ring-ring' : ''}`}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}

// Simplified version for chat messages
interface ChatRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSend?: () => void;
}

export function ChatRichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Type a message...",
  onSend
}: ChatRichTextEditorProps) {
  const insertFormatting = useCallback((format: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const selectedText = text.substring(start, end);
      
      let replacement = "";
      switch (format) {
        case "bold":
          replacement = `**${selectedText || "bold text"}**`;
          break;
        case "italic":
          replacement = `*${selectedText || "italic text"}*`;
          break;
        case "code":
          replacement = `\`${selectedText || "code"}\``;
          break;
        case "link":
          const url = prompt("Enter URL:");
          if (url) {
            replacement = `[${selectedText || "link text"}](${url})`;
          }
          break;
        case "mention":
          const mention = prompt("Enter @username:");
          if (mention) {
            replacement = `@${mention}`;
          }
          break;
        default:
          return;
      }
      
      if (replacement) {
        const newValue = text.substring(0, start) + replacement + text.substring(end);
        onChange(newValue);
        
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = start + replacement.length;
          textarea.selectionEnd = start + replacement.length;
        }, 0);
      }
    }
  }, [onChange]);

  const FormattingPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Bold className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("code")}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("link")}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertFormatting("mention")}
            title="Mention"
          >
            <AtSign className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="flex gap-2 items-end">
      <FormattingPopover />
      <div className="flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[40px] max-h-32 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && onSend) {
              e.preventDefault();
              onSend();
            }
          }}
        />
      </div>
      {onSend && (
        <Button onClick={onSend} size="sm">
          Send
        </Button>
      )}
    </div>
  );
}