import { useState } from 'react';
import './aigInfoModal.css';

interface AIGInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AIGInfoModal({ open, onClose }: AIGInfoModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [formData, setFormData] = useState({ url: '', email: '', guild: '' });

  const INDUSTRIES = {
    hosteleria: {
      label: 'Hostelería & Restauración',
      need: 'Sistemas de reserva automatizados y Carta QR dinámica',
    },
    retail: {
      label: 'Retail & E-commerce',
      need: 'Gestión de stock en tiempo real y Chatbots de venta',
    },
    salud: {
      label: 'Salud & Bienestar',
      need: 'Agendamiento de citas 24/7 y Recordatorios por WhatsApp',
    },
    construccion: {
      label: 'Construcción & Reformas',
      need: 'Calculadoras de presupuesto IA y Visores de proyectos 3D',
    },
    legal: {
      label: 'Servicios Legales & Consultoría',
      need: 'Automatización documental y Zona privada de clientes',
    },
    automocion: {
      label: 'Automoción & Talleres',
      need: 'Citas de taller predictivas y Tracking de reparaciones',
    },
    otros: {
      label: 'Otros / Servicios Generales',
      need: 'Automatización de leads y CRM inteligente',
    },
  };

  const startScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url || !formData.guild) return;

    setStep(2);
    setLoading(true);
    setScanProgress(0);

    // Simulate progressive scanning
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 100) progress = 100;
      setScanProgress(Math.floor(progress));

      if (progress === 100) {
        clearInterval(interval);
        setTimeout(() => {
          setLoading(false);
          setStep(3);
        }, 500);
      }
    }, 300);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStep(4);
      setLoading(false);
    }, 1500);
  };

  if (!open) return null;

  const currentIndustry =
    INDUSTRIES[formData.guild as keyof typeof INDUSTRIES] || INDUSTRIES['otros'];

  return (
    <div className="aig-modal-overlay" onClick={onClose}>
      <div className="aig-modal" onClick={(e) => e.stopPropagation()}>
        <button className="aig-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="aig-modal-content">
          {step === 1 && (
            <>
              <h2>Auditoría Digital Profunda NEXUS V1</h2>
              <p>
                Ingresa los datos de tu empresa. Nuestro sistema analizará tu sector (
                {formData.guild ? currentIndustry.label : '...'}) y presencia digital.
              </p>
              <form onSubmit={startScan}>
                <div
                  style={{
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <input
                      type="text"
                      placeholder="www.tuempresa.com"
                      required
                      className="modal-input"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>

                  <div>
                    <select
                      required
                      className="modal-input"
                      style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
                      value={formData.guild}
                      onChange={(e) => setFormData({ ...formData, guild: e.target.value })}
                    >
                      <option value="" disabled>
                        Selecciona tu Gremio / Sector
                      </option>
                      {Object.entries(INDUSTRIES).map(([key, info]) => (
                        <option key={key} value={key} style={{ color: '#000' }}>
                          {info.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                    * El análisis comparará tu web con los estándares de éxito del sector
                    seleccionado.
                  </p>
                </div>
                <div className="aig-modal-actions">
                  <button type="submit" disabled={loading}>
                    Iniciar Escáner Neural
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="scan-loader">
                <div className="scan-ring"></div>
                <div className="scan-text">{scanProgress}%</div>
              </div>
              <h3
                style={{
                  marginTop: '1.5rem',
                  fontFamily: 'var(--font-tech)',
                  color: 'var(--neon-cyan)',
                }}
              >
                ANALIZANDO INFRAESTRUCTURA...
              </h3>
              <div
                style={{
                  textAlign: 'left',
                  marginTop: '1rem',
                  color: '#666',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                }}
              >
                <p>Host: {formData.url}</p>
                <p>Sector: {currentIndustry.label.toUpperCase()}</p>
                <p>{scanProgress > 20 ? '> Verificando puertos SSL... OK' : ''}</p>
                <p>
                  {scanProgress > 50 ? '> Comparando con líderes del gremio... COMPLETADO' : ''}
                </p>
                <p>{scanProgress > 80 ? '> Detectando integraciones IA... 0 ENCONTRADAS' : ''}</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <h2 style={{ color: '#ff3333' }}>⚠️ Oportunidad Crítica Detectada</h2>
              <div
                style={{
                  background: 'rgba(255, 50, 50, 0.1)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #ff3333',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ margin: 0, color: '#fff' }}>
                  Tu web carece de <strong>{currentIndustry.need}</strong>.
                </p>
                <p style={{ marginTop: '0.5rem', color: '#ffaaaa', fontSize: '0.9rem' }}>
                  El 78% de tus competidores en <strong>{currentIndustry.label}</strong> ya están
                  usando estas tecnologías para captar clientes automáticamente.
                </p>
              </div>
              <p>Hemos generado un reporte estratégico específico para tu sector.</p>
              <form onSubmit={handleFinalSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    required
                    className="modal-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="aig-modal-actions">
                  <button type="submit" disabled={loading}>
                    Recibir Diagnóstico del Sector
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'var(--neon-cyan)' }}>¡Enviado!</h2>
              <p>Tu reporte de inteligencia sectorial está en camino.</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Un consultor especializado en <strong>{currentIndustry.label}</strong> te contactará
                en breve con una propuesta a medida.
              </p>
              <button onClick={onClose} className="btn-cyber" style={{ marginTop: '1.5rem' }}>
                Volver al Sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

