import { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export default function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };





  if (!open) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="login-modal-header">
          <div className="login-logo-container">
            <span className="login-logo-text">NEXUS</span>
            <div className="login-logo-glow"></div>
          </div>
          <h2 className="login-title">NEXUS V1 Central</h2>
          <p className="login-subtitle">Identificación de seguridad requerida</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label htmlFor="email">Identificador Neural (Email)</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="noepab@github.com"
              required
              disabled={loading}
              className="login-input"
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password">Clave de Acceso</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="login-input"
            />
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-submit-btn">
            {loading ? (
              <>
                <span className="login-spinner"></span>
                Verificando Credenciales...
              </>
            ) : (
              <>
                <span>🔓</span>
                Acceder al Sistema
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => handleDemoLogin('demo@NEXUS V1.io', 'demo123')}
            className="text-xs text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-widest border border-transparent hover:border-cyan-500/30 px-4 py-2 rounded-full"
            type="button"
          >
            [ INICIAR MODO DEMO ]
          </button>
        </div>

        <div className="login-footer">
          <p>
            ¿Olvidaste tu contraseña? <a href="#recovery">Recuperar</a>
          </p>
        </div>
      </div>
    </div>
  );
}

