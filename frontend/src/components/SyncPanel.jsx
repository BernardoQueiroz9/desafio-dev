const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '8px',
    maxWidth: '640px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--ml-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--ml-text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--ml-text-tertiary)',
    padding: '4px',
    borderRadius: '4px',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemCard: {
    border: '1px solid var(--ml-border)',
    borderRadius: '6px',
    padding: '16px',
    background: '#FAFAFA',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--ml-text-primary)',
    marginBottom: '12px',
  },
  diffRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '8px 0',
    borderBottom: '1px solid var(--ml-border)',
    fontSize: '13px',
  },
  fieldLabel: {
    fontWeight: 600,
    color: 'var(--ml-text-secondary)',
    minWidth: '80px',
    textTransform: 'capitalize',
  },
  localVal: {
    color: 'var(--ml-text-primary)',
    flex: 1,
  },
  mlVal: {
    color: 'var(--ml-red)',
    flex: 1,
  },
  arrow: {
    color: 'var(--ml-text-tertiary)',
    padding: '0 8px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  acceptBtn: {
    background: 'var(--ml-blue)',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  keepBtn: {
    background: '#fff',
    color: 'var(--ml-text-secondary)',
    border: '1px solid var(--ml-border)',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid var(--ml-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    background: 'var(--ml-red)',
    padding: '2px 8px',
    borderRadius: '10px',
    cursor: 'pointer',
    border: 'none',
    marginLeft: '12px',
  },
  okBadge: {
    background: 'var(--ml-green)',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'default',
  },
  summary: {
    fontSize: '13px',
    color: 'var(--ml-text-secondary)',
    textAlign: 'center',
    padding: '24px',
  },
};

function formatVal(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
  return String(val);
}

export default function SyncPanel({ divergences, checked, onAccept, onAcceptAll, onClose }) {
  if (divergences.length === 0) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div className="sync-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <span style={styles.title}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ml-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Sincronização
            </span>
            <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div style={styles.summary}>
            <strong>{checked}</strong> anúncios verificados — nenhuma divergência encontrada
          </div>
          <div style={styles.footer}>
            <button style={styles.acceptBtn} onClick={onClose}>Ok</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div className="sync-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ml-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {divergences.length} divergência{divergences.length > 1 ? 's' : ''} encontrada{divergences.length > 1 ? 's' : ''}
          </span>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={styles.body}>
          {divergences.map((item) => (
            <div key={item.ml_id} style={styles.itemCard}>
              <div style={styles.itemTitle}>{item.local.title}</div>
              {Object.entries(item.diff).map(([field, vals]) => (
                <div key={field} style={styles.diffRow}>
                  <span style={styles.fieldLabel}>{field === 'available_quantity' ? 'Estoque' : field}</span>
                  <span style={styles.localVal}>{formatVal(vals.local)}</span>
                  <span style={styles.arrow}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </span>
                  <span style={styles.mlVal}>{formatVal(vals.marketplace)}</span>
                </div>
              ))}
              <div style={styles.actions}>
                <button
                  style={styles.acceptBtn}
                  onClick={() => onAccept(item._id, item.marketplace)}
                >
                  Aceitar do marketplace
                </button>
                <button
                  style={styles.keepBtn}
                  onClick={() => onAccept(item._id, null)}
                >
                  Manter local
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.footer}>
          <button style={styles.keepBtn} onClick={onClose}>Fechar</button>
          <button style={styles.acceptBtn} onClick={onAcceptAll}>
            Aceitar todas
          </button>
        </div>
      </div>
    </div>
  );
}
