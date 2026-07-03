import { useState, useEffect } from 'react';
import { api } from '../api';
import ErrorScreen from './ErrorScreen';

const colors = {
  blue: '#3483FA', blueDark: '#2968C8', blueLight: '#E7F0FF',
  text: '#333', textSec: '#666', textTer: '#999',
  border: '#E0E0E0', bgCard: '#FFF', bgBody: '#FAFAFA',
};

export default function CategoryPicker({ value, onChange }) {
  const [levels, setLevels] = useState([]);
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/categories')
      .then(res => {
        setLevels([res.data]);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar categorias');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (value && selections.length === 0) {
      onChange(value);
    }
  }, [value]);

  const checkCategory = async (catId) => {
    try {
      const res = await api.get(`/categories/check/${catId}`);
      setCheckResult(res.data);
    } catch {
      setCheckResult(null);
    }
  };

  const handleSelect = async (catId, catName, levelIndex) => {
    const newSelections = [...selections.slice(0, levelIndex), { id: catId, name: catName }];
    setSelections(newSelections);
    setCheckResult(null);

    const isLastLevel = levelIndex >= levels.length - 1;
    if (!isLastLevel) {
      setLevels(levels.slice(0, levelIndex + 1));
    }

    setLoading(true);
    try {
      const res = await api.get(`/categories/${catId}/children`);
      if (res.data.length > 0) {
        setLevels(prev => [...prev.slice(0, levelIndex + 1), res.data]);
      } else {
        onChange(catId);
        checkCategory(catId);
      }
    } catch {
      onChange(catId);
      checkCategory(catId);
    }
    setLoading(false);
  };

  if (loading && levels.length === 1 && levels[0]?.length === 0) {
    return (
      <div style={{ padding: '12px', color: colors.textTer, fontSize: '13px' }}>
        Carregando categorias...
      </div>
    );
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;
  }

  const selectedPath = selections.map(s => s.name).join(' > ');

  const quickCategories = [
    { id: 'MLB1430', name: 'Roupas' },
    { id: 'MLB1136', name: 'Brinquedos' },
    { id: 'MLB1132', name: 'Ferramentas' },
    { id: 'MLB1039', name: 'Papelaria' },
  ];

  if (!levels[0]?.length) {
    return (
      <div>
        <p style={{ fontSize: '13px', color: colors.textSec, marginBottom: '10px' }}>
          Ou escolha uma categoria rápida:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {quickCategories.map(cat => (
            <button key={cat.id} type="button" onClick={() => {
              setSelections([{ id: cat.id, name: cat.name }]);
              onChange(cat.id);
              checkCategory(cat.id);
            }} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', border: '1.5px solid var(--ml-blue)',
              background: '#FFF', color: 'var(--ml-blue)',
            }}>
              {cat.name}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: colors.textTer, marginTop: '10px' }}>
          Essas categorias funcionam com sua conta atual.
        </p>
      </div>
    );
  }

  return (
    <div>
      {selectedPath && (
        <div style={{
          fontSize: '12px', color: colors.blue, fontWeight: 600,
          marginBottom: '8px', padding: '6px 10px', background: colors.blueLight,
          borderRadius: '4px',
        }}>
          {selectedPath}
        </div>
      )}

      {levels.map((cats, level) => (
        <div key={level} style={{ marginBottom: level < levels.length - 1 ? '8px' : 0 }}>
          {level > 0 && (
            <div style={{ fontSize: '11px', color: colors.textTer, fontWeight: 600, marginBottom: '4px' }}>
              Subcategoria
            </div>
          )}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px',
            maxHeight: level === levels.length - 1 ? '200px' : 'none',
            overflowY: level === levels.length - 1 ? 'auto' : 'visible',
          }}>
            {cats.map(cat => {
              const isSelected = selections[level]?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id, cat.name, level)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: `1.5px solid ${isSelected ? colors.blue : colors.border}`,
                    background: isSelected ? colors.blueLight : '#FFF',
                    color: isSelected ? colors.blue : colors.textSec,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.1s',
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {loading && (
        <div style={{ padding: '8px', color: colors.textTer, fontSize: '12px' }}>
          Carregando...
        </div>
      )}

      {levels[0]?.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--ml-border, #eee)' }}>
          <p style={{ fontSize: '11px', color: colors.textTer, marginBottom: '6px' }}>
            Categorias recomendadas (funcionam com sua conta):
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {quickCategories.map(cat => (
              <button key={cat.id} type="button" onClick={() => {
                setSelections([{ id: cat.id, name: cat.name }]);
                onChange(cat.id);
                checkCategory(cat.id);
              }} style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', border: '1px solid var(--ml-blue)',
                background: '#FFF', color: 'var(--ml-blue)',
              }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {checkResult && (
        <div style={{
          marginTop: '10px', padding: '8px 10px', borderRadius: '6px', fontSize: '12px',
          background: checkResult.compatible ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${checkResult.compatible ? '#bbf7d0' : '#fee2e2'}`,
          color: checkResult.compatible ? '#166534' : '#991b1b',
        }}>
          {checkResult.compatible
            ? '✓ Esta categoria é compatível com anúncios gratuitos.'
            : '⚠ Esta categoria pode não aceitar anúncios gratuitos. Se falhar, tente "Roupas", "Brinquedos" ou "Ferramentas".'
          }
        </div>
      )}
    </div>
  );
}
