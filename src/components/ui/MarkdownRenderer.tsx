"use client";

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      return !inline && language ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={language}
          PreTag="div"
          className="rounded-md text-sm"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={cn(
          "bg-muted px-1 py-0.5 rounded text-sm font-mono",
          inline ? "inline-block" : "block"
        )} {...props}>
          {children}
        </code>
      );
    },
    pre({ children }: any) {
      return (
        <pre className="bg-muted p-3 rounded-md overflow-x-auto my-2">
          {children}
        </pre>
      );
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-4 border-border pl-4 italic my-2 bg-muted/50 py-2">
          {children}
        </blockquote>
      );
    },
    ul({ children }: any) {
      return (
        <ul className="list-disc list-inside my-2 space-y-1">
          {children}
        </ul>
      );
    },
    ol({ children }: any) {
      return (
        <ol className="list-decimal list-inside my-2 space-y-1">
          {children}
        </ol>
      );
    },
    li({ children }: any) {
      return (
        <li className="pl-2">
          {children}
        </li>
      );
    },
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-border">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return (
        <thead className="bg-muted">
          {children}
        </thead>
      );
    },
    tbody({ children }: any) {
      return (
        <tbody>
          {children}
        </tbody>
      );
    },
    tr({ children }: any) {
      return (
        <tr className="border-b border-border">
          {children}
        </tr>
      );
    },
    th({ children }: any) {
      return (
        <th className="px-4 py-2 text-left font-medium">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td className="px-4 py-2">
          {children}
        </td>
      );
    },
    h1({ children }: any) {
      return (
        <h1 className="text-2xl font-bold mt-4 mb-2">
          {children}
        </h1>
      );
    },
    h2({ children }: any) {
      return (
        <h2 className="text-xl font-semibold mt-3 mb-2">
          {children}
        </h2>
      );
    },
    h3({ children }: any) {
      return (
        <h3 className="text-lg font-medium mt-3 mb-1">
          {children}
        </h3>
      );
    },
    h4({ children }: any) {
      return (
        <h4 className="text-base font-medium mt-2 mb-1">
          {children}
        </h4>
      );
    },
    h5({ children }: any) {
      return (
        <h5 className="text-sm font-medium mt-2 mb-1">
          {children}
        </h5>
      );
    },
    h6({ children }: any) {
      return (
        <h6 className="text-sm font-medium mt-1 mb-1">
          {children}
        </h6>
      );
    },
    p({ children }: any) {
      return (
        <p className="my-2">
          {children}
        </p>
      );
    },
    a({ children, href }: any) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {children}
        </a>
      );
    },
    strong({ children }: any) {
      return (
        <strong className="font-semibold">
          {children}
        </strong>
      );
    },
    em({ children }: any) {
      return (
        <em className="italic">
          {children}
        </em>
      );
    },
    del({ children }: any) {
      return (
        <del className="line-through">
          {children}
        </del>
      );
    },
    hr() {
      return (
        <hr className="my-4 border-border" />
      );
    },
    img({ src, alt }: any) {
      return (
        <img 
          src={src} 
          alt={alt || "Image"} 
          className="max-w-full h-auto rounded-md my-2"
        />
      );
    }
  };

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Simplified version for chat messages
interface ChatMarkdownRendererProps {
  content: string;
  className?: string;
}

export function ChatMarkdownRenderer({ content, className }: ChatMarkdownRendererProps) {
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      return inline ? (
        <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      ) : (
        <div className="bg-muted p-2 rounded text-sm font-mono my-1" {...props}>
          {children}
        </div>
      );
    },
    blockquote({ children }: any) {
      return (
        <blockquote className="border-l-2 border-border pl-3 italic my-1 text-sm">
          {children}
        </blockquote>
      );
    },
    ul({ children }: any) {
      return (
        <ul className="list-disc list-inside my-1 text-sm space-y-0.5">
          {children}
        </ul>
      );
    },
    ol({ children }: any) {
      return (
        <ol className="list-decimal list-inside my-1 text-sm space-y-0.5">
          {children}
        </ol>
      );
    },
    li({ children }: any) {
      return (
        <li className="pl-1">
          {children}
        </li>
      );
    },
    p({ children }: any) {
      return (
        <p className="my-1">
          {children}
        </p>
      );
    },
    a({ children, href }: any) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm"
        >
          {children}
        </a>
      );
    },
    strong({ children }: any) {
      return (
        <strong className="font-semibold">
          {children}
        </strong>
      );
    },
    em({ children }: any) {
      return (
        <em className="italic">
          {children}
        </em>
      );
    },
    del({ children }: any) {
      return (
        <del className="line-through">
          {children}
        </del>
      );
    }
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}