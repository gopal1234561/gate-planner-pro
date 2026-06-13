import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface FormattedAnswerProps {
  text: string;
}

interface Block {
  type: 'code' | 'text';
  content: string;
  lang?: string;
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) {
      blocks.push({ type: 'text', content: text.slice(lastIndex, m.index) });
    }
    blocks.push({ type: 'code', lang: m[1] || 'code', content: m[2].replace(/\n$/, '') });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.slice(lastIndex) });
  }
  if (blocks.length === 0) blocks.push({ type: 'text', content: text });
  return blocks;
}

const InlineText: React.FC<{ content: string }> = ({ content }) => {
  // Render `inline code` and **bold**
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(content)) !== null) {
    if (m.index > last) parts.push(content.slice(last, m.index));
    const token = m[0];
    if (token.startsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[0.85em] text-primary"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    }
    last = m.index + token.length;
  }
  if (last < content.length) parts.push(content.slice(last));
  return <>{parts}</>;
};

const CodeBlock: React.FC<{ lang: string; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground uppercase">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-relaxed">
        <code className="font-mono text-[#e6edf3] whitespace-pre">{code}</code>
      </pre>
    </div>
  );
};

export const FormattedAnswer: React.FC<FormattedAnswerProps> = ({ text }) => {
  const blocks = parseBlocks(text);
  return (
    <div className="text-sm text-foreground leading-relaxed space-y-2">
      {blocks.map((b, i) =>
        b.type === 'code' ? (
          <CodeBlock key={i} lang={b.lang || 'code'} code={b.content} />
        ) : (
          <div key={i} className="whitespace-pre-wrap">
            <InlineText content={b.content} />
          </div>
        )
      )}
    </div>
  );
};

export default FormattedAnswer;
