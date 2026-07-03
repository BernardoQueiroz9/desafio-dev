import { useNavigate } from 'react-router-dom';

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
  title: {
    fontSize: '14px',
    color: 'var(--ml-text-secondary)',
    lineHeight: '1.35',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  condition: {
    fontSize: '12px',
    color: 'var(--ml-text-tertiary)',
    marginBottom: '2px',
  },
  shippingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--ml-green)',
    padding: '2px 0',
    width: 'fit-content',
    marginTop: '2px',
  },
  fullBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#8B6F00',
    background: '#FDF0D5',
    padding: '2px 6px',
    borderRadius: '3px',
    width: 'fit-content',
    marginTop: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  badgesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '2px',
  },
};

export default function ProductCard({ ad }) {
  const navigate = useNavigate();
  const imageSrc = ad.image || PLACEHOLDER;

  const priceDisplay = formatPrice(ad.price);

  return (
    <article
      style={styles.card}
      onClick={() => navigate(`/dashboard/produto/${ad._id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={styles.imageWrapper}>
        <img
          key={ad._id}
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
          {priceDisplay}
        </div>
        <h3 style={styles.title}>{ad.title}</h3>
        {ad.user?.name && (
          <span style={{ fontSize: '12px', color: 'var(--ml-text-tertiary)', marginTop: '2px' }}>
            {ad.user.name}
          </span>
        )}
        <div style={styles.badgesRow}>
          {ad.free_shipping && (
            <div style={styles.shippingBadge}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L11 4.5L8 8L5 4.5L8 1Z" fill="currentColor"/>
                <path d="M1 8L4.5 5L8 8L4.5 11L1 8Z" fill="currentColor"/>
                <path d="M8 8L11 11L8 15L5 11L8 8Z" fill="currentColor"/>
                <path d="M15 8L11 5L8 8L11 11L15 8Z" fill="currentColor"/>
              </svg>
              Frete grátis
            </div>
          )}
          {ad.is_full && (
            <div style={styles.fullBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#8B6F00">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Full
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
