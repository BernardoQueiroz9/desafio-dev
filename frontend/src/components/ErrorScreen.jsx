import { useEffect, useState } from 'react';

export default function ErrorScreen({ message, details, onRetry, fullPage }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: fullPage ? '0 24px' : '80px 24px',
      minHeight: fullPage ? '100vh' : 'auto',
      transition: 'opacity 0.3s ease',
      opacity: visible ? 1 : 0,
    }}>
      <svg
        width="64" height="64" viewBox="0 0 24 24"
        fill="none" stroke="var(--ml-red)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ marginBottom: '20px', opacity: 0.7 }}
      >
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>

      <h2 style={{
        fontSize: '20px', fontWeight: 600, color: 'var(--ml-text-secondary)',
        marginBottom: '8px',
      }}>
        Algo deu errado
      </h2>

      <p style={{
        fontSize: '14px', color: 'var(--ml-text-tertiary)',
        maxWidth: '360px', marginBottom: '24px', lineHeight: '1.5',
      }}>
        {message || 'Não foi possível completar a operação. Verifique sua conexão e tente novamente.'}
      </p>

      {details && details.cause && details.cause.length > 0 && (
        <div style={{
          textAlign: 'left', maxWidth: '400px', width: '100%',
          marginBottom: '16px', padding: '12px', borderRadius: '8px',
          background: '#fef2f2', border: '1px solid #fee2e2',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', marginBottom: '6px' }}>
            Detalhes do erro:
          </p>
          {details.cause.map((c, i) => (
            <p key={i} style={{ fontSize: '12px', color: '#7f1d1d', marginBottom: '4px', lineHeight: '1.4' }}>
              {c.message || c.code || JSON.stringify(c)}
            </p>
          ))}
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'var(--ml-blue)',
            color: '#fff',
            border: 'none',
            padding: '10px 28px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ml-blue-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--ml-blue)'}
        >
          Tentar novamente
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ml-bg)',
      }}>
        {content}
      </div>
    );
  }

  return <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{content}</div>;
}
