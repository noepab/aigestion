import { memo, useMemo } from 'react';
import './PricingSection.css';

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  buttonText?: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'IT Optimization',
    price: '€299',
    period: '/mes + Alta',
    description: 'Pequeñas Empresas',
    features: [
      'Instalación de Redes & WiFi Pro',
      'Gestión de Dispositivos (MDM)',
      'Soporte Remoto 24/7',
      'Ciberseguridad Básica',
      'Mantenimiento de Hardware',
    ],
    buttonText: 'Solicitar Diagnóstico',
  },
  {
    name: 'AI Integration',
    price: '€999',
    period: '/mes',
    description: 'PYMEs en Expansión',
    features: [
      'Todo lo de IT Optimization',
      'Implementación CRM + ERP IA',
      '3 Agentes de Automatización',
      'Chatbot Atención 24/7',
      'Dashboard Business Intelligence',
    ],
    highlighted: true,
    badge: 'BEST SELLER',
    buttonText: 'Transformar Ahora',
  },
  {
    name: 'Full Enterprise',
    price: 'A Medida',
    description: 'Grandes Corporaciones',
    features: [
      'Arquitectura de Servidores On-Premise',
      'Modelos LLM Privados y Locales',
      'Automatización Robótica (RPA)',
      'Consultoría Estratégica Semanal',
      'Despliegue de Hardware Masivo',
    ],
    buttonText: 'Contactar Ingeniería',
  },
];

interface PricingSectionProps {
  onPlanSelect: (planName: string) => void;
}

function PricingSection({ onPlanSelect }: PricingSectionProps) {
  // Memoizar planes para evitar re-creación
  const plans = useMemo(() => PRICING_PLANS, []);

  return (
    <section className="pricing-section section-spacing" id="pricing">
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2.5rem' }}>Planes de Transformación 360°</h2>
        <p className="lead" style={{ margin: '0 auto 4rem', textAlign: 'center' }}>
          No solo software. Optimizamos tu infraestructura física y digital para la era de la IA.
        </p>

        <div className="pricing-grid">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`pricing-card ${plan.highlighted ? 'featured' : ''}`}
            >
              {plan.badge && <div className="pricing-badge">{plan.badge}</div>}

              <div className="pricing-header">
                <h3>{plan.name}</h3>
                <div className="price">{plan.price}<span>{plan.period}</span></div>
                <p style={{ fontSize: '0.8rem', color: idx === 1 ? '#aaa' : '#888', marginTop: '0.5rem' }}>
                  {plan.description}
                </p>
              </div>

              <div className="pricing-features">
                <ul>
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      {/* Checks if feature starts with "Todo lo de" to bold it, a bit hacky but keeps it simple matching original */}
                      {feature.startsWith('Todo lo de') ? (
                        <>✓ <strong>{feature}</strong></>
                      ) : (
                        `✓ ${feature}`
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={plan.highlighted ? 'btn-glitch' : 'btn-cyber'}
                style={plan.highlighted ? { width: '100%' } : {}}
                onClick={() => onPlanSelect(plan.name)}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(PricingSection);
