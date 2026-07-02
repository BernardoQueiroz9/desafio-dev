const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#F5F5F5" width="200" height="200"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#CCCCCC" font-family="sans-serif" font-size="14">Sem imagem</text></svg>'
);

const formatPrice = (num) => {
  if (num === null || num === undefined) return '';
  return Number(num).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const styles = {
  card: {
    background: 'var(--ml-bg-card)',
    borderRadius: '4px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.2s',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  cardHover: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
  imageWrapper: {
    position: 'relative',
    paddingTop: '100%',
    background: '#F5F5F5',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '16px',
    transition: 'transform 0.3s',
  },
  info: {
    padding: '12px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderTop: '1px solid var(--ml-border)',
  },
  price: {
    fontSize: '24px',
    fontWeight: 400,
    color: 'var(--ml-text-primary)',
    letterSpacing: '-0.3px',
  },
  priceFraction: {
    fontSize: '16px',
    verticalAlign: 'super',
  },
  title: {
    fontSize: '14px',
    color: 'var(--ml-text-secondary)',
    lineHeight: '1.35',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  shippingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--ml-green)',
    background: 'var(--ml-green-light)',
    padding: '2px 8px',
    borderRadius: '3px',
    width: 'fit-content',
    marginTop: '6px',
  },
  condition: {
    fontSize: '12px',
    color: 'var(--ml-text-tertiary)',
    marginBottom: '2px',
  },
};

export default function ProductCard({ ad }) {
  const imageSrc = ad.image || PLACEHOLDER;

  return (
    <article
      style={styles.card}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, styles.cardHover);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={styles.imageWrapper}>
        <img
          src={imageSrc}
          alt={ad.title}
          style={styles.image}
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
      </div>
      <div style={styles.info}>
        {ad.condition && (
          <span style={styles.condition}>{ad.condition}</span>
        )}
        <div style={styles.price}>
          {formatPrice(ad.price)}
        </div>
        <h3 style={styles.title}>{ad.title}</h3>
        {ad.user?.name && (
          <span style={{ fontSize: '12px', color: 'var(--ml-text-tertiary)', marginTop: '2px' }}>
            Anunciado por: {ad.user.name}
          </span>
        )}
        <div style={styles.shippingBadge}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L11 4.5L8 8L5 4.5L8 1Z" fill="currentColor"/>
            <path d="M1 8L4.5 5L8 8L4.5 11L1 8Z" fill="currentColor"/>
            <path d="M8 8L11 11L8 15L5 11L8 8Z" fill="currentColor"/>
            <path d="M15 8L11 5L8 8L11 11L15 8Z" fill="currentColor"/>
          </svg>
          Frete grátis
        </div>
      </div>
    </article>
  );
}
