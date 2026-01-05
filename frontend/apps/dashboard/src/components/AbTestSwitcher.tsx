import { useState } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import './AbTestSwitcher.css';

export const AbTestSwitcher = () => {
  const { flags, loading, error, refresh } = useFeatureFlags();
  const [updating, setUpdating] = useState(false);

  const toggle = async () => {
    if (!flags) return;
    const newValue = flags.ab_test === 'control' ? 'variant' : 'control';
    setUpdating(true);
    try {
      const res = await fetch('/api/v1/flags/ab_test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) throw new Error('Failed to set flag');
      await refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loader">Cargando flags…</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="ab-switcher">
      <h2>Experimento A/B – Dashboard</h2>
      <p>Estado actual: <strong>{flags?.ab_test}</strong></p>
      <button
        className={`toggle ${flags?.ab_test}`}
        onClick={toggle}
        disabled={updating}
      >
        Cambiar a {flags?.ab_test === 'control' ? 'variant' : 'control'}
      </button>
    </div>
  );
};
