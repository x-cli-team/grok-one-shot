import React, { useState } from 'react';
import styles from './CopyCodeBlock.module.css';

interface CopyCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export default function CopyCodeBlock({ code, language = 'bash', filename }: CopyCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.codeBlock}>
      {filename && <div className={styles.filename}>{filename}</div>}
      <div className={styles.header}>
        <span className={styles.language}>{language}</span>
        <button 
          className={styles.copyButton}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 01-3 3H6.75a3 3 0 01-3-3V9.375A3.375 3.375 0 017.502 6zM15 9.375a1.875 1.875 0 00-1.875-1.875H7.502a1.875 1.875 0 00-1.875 1.875V21a1.5 1.5 0 001.5 1.5h7.5A1.5 1.5 0 0016.5 21V9.375zM6 3.75a.75.75 0 01.75-.75h6.75a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75zM8.25 1.5a.75.75 0 01.75-.75h6a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          )}
          <span className={styles.copyText}>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className={styles.code}>
        <code>{code}</code>
      </pre>
    </div>
  );
}