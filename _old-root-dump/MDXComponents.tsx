import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import Admonition from '@theme/Admonition';

// Custom Card component
export function Card({ title, icon, href, children }: { title?: string; icon?: string; href?: string; children?: React.ReactNode }) {
  const content = (
    <div style={{
      border: '1px solid var(--ifm-color-emphasis-300)',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      transition: 'all 0.2s ease'
    }}>
      {icon && <span style={{ marginRight: '0.5rem' }}>{icon}</span>}
      {title && <h4 style={{ margin: '0 0 0.5rem 0' }}>{title}</h4>}
      {children && <div>{children}</div>}
    </div>
  );

  if (href) {
    return <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</a>;
  }

  return content;
}

// Custom CardGroup component
export function CardGroup({ cols, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      margin: '1rem 0'
    }}>
      {children}
    </div>
  );
}

// Map custom components to Docusaurus Admonitions
export function Note({ children }: { children: React.ReactNode }) {
  return <Admonition type="note">{children}</Admonition>;
}

export function Tip({ children }: { children: React.ReactNode }) {
  return <Admonition type="tip">{children}</Admonition>;
}

export function Warning({ children }: { children: React.ReactNode }) {
  return <Admonition type="warning">{children}</Admonition>;
}

export function Info({ children }: { children: React.ReactNode }) {
  return <Admonition type="info">{children}</Admonition>;
}

export function Caution({ children }: { children: React.ReactNode }) {
  return <Admonition type="caution">{children}</Admonition>;
}

export function Danger({ children }: { children: React.ReactNode }) {
  return <Admonition type="danger">{children}</Admonition>;
}

// Steps components for step-by-step guides
export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      counterReset: 'step',
      marginTop: '1rem',
      marginBottom: '1rem'
    }}>
      {children}
    </div>
  );
}

export function Step({ children, title }: { children?: React.ReactNode; title?: string }) {
  return (
    <div style={{
      counterIncrement: 'step',
      position: 'relative',
      paddingLeft: '2.5rem',
      marginBottom: '2rem',
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '1.75rem',
        height: '1.75rem',
        borderRadius: '50%',
        backgroundColor: 'var(--ifm-color-primary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: 'bold',
      }}>
        <span style={{ content: 'counter(step)' }}></span>
      </div>
      {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
      <div>{children}</div>
    </div>
  );
}

export default {
  ...MDXComponents,
  Note,
  Tip,
  Warning,
  Info,
  Caution,
  Danger,
  Card,
  CardGroup,
  Steps,
  Step,
};
