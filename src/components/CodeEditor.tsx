'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'json' | 'javascript' | 'text' | 'xml';
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}
export default function CodeEditor({
  value,
  onChange,
  language = 'json',
  placeholder = '',
  className = '',
  readOnly = false
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [displayValue, setDisplayValue] = useState('');
  
  // Apply syntax highlighting
  useEffect(() => {
    if (language === 'json') {
      setDisplayValue(highlightJSON(value));
    } else if (language === 'javascript') {
      setDisplayValue(highlightJavaScript(value));
    } else if (language === 'xml') {
      setDisplayValue(highlightXML(value));
    } else {
      // For plain text, just escape HTML
      setDisplayValue(escapeHtml(value));
    }
  }, [value, language]);
  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  // Enhanced syntax highlighting functions
  const highlightJSON = (code: string): string => {
    if (!code) return '';
    try {
      // Try to parse and re-stringify for consistent formatting
      const parsed = JSON.parse(code);
      code = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If parsing fails, continue with original code
    }
    
    return escapeHtml(code)
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
  };

  const highlightJavaScript = (code: string): string => {
    return escapeHtml(code)
      .replace(/\b(function|return|if|else|for|while|do|break|continue|switch|case|default|var|let|const|try|catch|finally|throw|new|this|typeof|instanceof|in|of|await|async|yield|class|extends|import|export|from|as|default)\b/g, '<span class="keyword">$&</span>')
      .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="boolean">$&</span>')
      .replace(/\b(console|window|document|JSON|Math|Date|Array|Object|String|Number|Boolean|RegExp|Error|Promise|pm|expect|test)\b/g, '<span class="builtin">$&</span>')
      .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, '<span class="string">$&</span>')
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$&</span>')
      .replace(/(\d+)/g, '<span class="number">$&</span>');
  };

  const highlightXML = (code: string): string => {
    return escapeHtml(code)
      .replace(/(&lt;\/?[^&gt;]+&gt;)/g, '<span class="keyword">$&</span>') // Tags
      .replace(/(&quot;[^&quot;]*&quot;|'[^']*')/g, '<span class="string">$&</span>') // Attributes
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$&</span>'); // Comments
  };
  // Enhanced auto-closing functionality
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Auto-close quotes
    if (e.key === '"' || e.key === "'") {
      e.preventDefault();
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + e.key + e.key + after;
      onChange(newValue);
      
      // Move cursor between the quotes
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 1;
          textareaRef.current.selectionEnd = start + 1;
        }
      }, 0);
      return;
    }
    
    // Auto-close braces and brackets
    const pairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')'
    };
    
    if (pairs[e.key]) {
      e.preventDefault();
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + e.key + pairs[e.key] + after;
      onChange(newValue);
      
      // Move cursor between the pair
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 1;
          textareaRef.current.selectionEnd = start + 1;
        }
      }, 0);
      return;
    }
    
    // Handle backspace for empty pairs
    if (e.key === 'Backspace') {
      const before = value.substring(0, start);
      const after = value.substring(end);
      const beforeChar = before.charAt(before.length - 1);
      const afterChar = after.charAt(0);
      
      const pairs: Record<string, string> = {
        '{': '}',
        '[': ']',
        '(': ')',
        '"': '"',
        "'": "'"
      };
      
      if (pairs[beforeChar] && pairs[beforeChar] === afterChar) {
        e.preventDefault();
        const newValue = before.substring(0, before.length - 1) + after.substring(1);
        onChange(newValue);
        
        // Keep cursor position
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start - 1;
            textareaRef.current.selectionEnd = start - 1;
          }
        }, 0);
        return;
      }
    }
    
    // Handle Enter key for better indentation
    if (e.key === 'Enter') {
      e.preventDefault();
      const lines = value.split('\n');
      const currentLineIndex = value.substring(0, start).split('\n').length - 1;
      const currentLine = lines[currentLineIndex];
      
      // Get indentation of current line
      const indentationMatch = currentLine.match(/^(\s*)/);
      let indentation = indentationMatch ? indentationMatch[1] : '';
      
      // Check if we need to add more indentation
      const lastChar = currentLine.trim().slice(-1);
      if (lastChar === '{' || lastChar === '[') {
        indentation += '  '; // Add 2 spaces for indentation
      }
      
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + '\n' + indentation + after;
      onChange(newValue);
      
      // Move cursor to new position
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPosition = start + 1 + indentation.length;
          textareaRef.current.selectionStart = newCursorPosition;
          textareaRef.current.selectionEnd = newCursorPosition;
        }
      }, 0);
      return;
    }
    
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const before = value.substring(0, start);
      const after = value.substring(end);
      const newValue = before + '  ' + after; // Add 2 spaces
      onChange(newValue);
      
      // Move cursor to new position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
      return;
    }
    
    // Handle closing pairs when cursor is at the closing character
    const closingPairs: Record<string, string> = {
      '}': '{',
      ']': '[',
      ')': '(',
      '"': '"',
      "'": "'"
    };
    
    if (closingPairs[e.key]) {
      const before = value.substring(0, start);
      const after = value.substring(end);
      const nextChar = after.charAt(0);
      
      // If the next character is the same as the one we're typing, just move cursor
      if (nextChar === e.key) {
        e.preventDefault();
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
        return;
      }
    }
  };

  return (
    <div className={`relative ${className}`} style={{ minHeight: '100px', height: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full h-full p-3 bg-black rounded border border-slate-600 focus:border-yellow-400 focus:outline-none font-mono text-sm resize-none absolute inset-0"
        style={{ 
          color: 'white',
          caretColor: 'white',
          zIndex: 10
        }}
      />
      <pre 
        className="w-full h-full p-3 bg-slate-800 rounded border border-slate-600 font-mono text-sm whitespace-pre-wrap break-all absolute inset-0 pointer-events-none overflow-auto"
        style={{ zIndex: 1, color: 'white' }}
        dangerouslySetInnerHTML={{ __html: displayValue || `<span style="color: #666;">${escapeHtml(placeholder)}</span>` }}
      />
      <style jsx>{`
        .key { color: #f9d71c; }
        .string { color: #ce9178; }
        .number { color: #b5cea8; }
        .boolean { color: #569cd6; }
        .null { color: #569cd6; }
        .keyword { color: #c586c0; }
        .builtin { color: #4ec9b0; }
        .comment { color: #6a9955; }
      `}</style>
    </div>
  );
};