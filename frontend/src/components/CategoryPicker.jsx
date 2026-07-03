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

  const handleSelect = async (catId, catName, levelIndex) => {
    const newSelections = [...selections.slice(0, levelIndex), { id: catId, name: catName }];
    setSelections(newSelections);

    if (levelIndex < levels.length - 1) {
      setLevels(levels.slice(0, levelIndex + 1));
      setLoading(true);
      try {
        const res = await api.get(`/categories/${catId}/children`);
        if (res.data.length > 0) {
          setLevels(prev => [...prev.slice(0, levelIndex + 1), res.data]);
        }
        onChange(catId);
      } catch {
        onChange(catId);
      }
      setLoading(false);
    } else {
      setLoading(true);
      try {
        const res = await api.get(`/categories/${catId}/children`);
        if (res.data.length > 0) {
          setLevels(prev => [...prev, res.data]);
        } else {
          onChange(catId);
        }
      } catch {
        onChange(catId);
      }
      setLoading(false);
    }
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
    </div>
  );
}
