import { useState } from 'react';
import './aigInfoModal.css';

const steps = [
  {
    title: 'Bienvenido al Futuro NEXUS V1',
    text: 'NEXUS V1 es tu cerebro digital para automatizar, liderar y evolucionar tu empresa con IA. Descubre cómo transformar tu gestión en minutos.',
  },
  {
    title: '¿Cómo funciona NEXUS V1?',
    text: 'NEXUS V1 conecta tus apps favoritas, aprende de tus datos y ejecuta tareas inteligentes. Todo desde una interfaz intuitiva y visual.',
  },
  {
    title: 'Automatización Futurista',
    text: 'Configura flujos automáticos, recibe sugerencias de IA y monitoriza resultados en tiempo real. NEXUS V1 evoluciona contigo.',
  },
  {
    title: 'Ofertas Pro',
    text: 'Usuario PRO desde $19/mes: Acceso ilimitado, soporte premium, IA avanzada y actualizaciones exclusivas. ¡Activa tu cerebro digital hoy!',
  },
  {
    title: '¿Listo para el cambio?',
    text: 'Solicita tu demo, explora el dashboard y lleva tu gestión al siguiente nivel. El futuro es NEXUS V1.',
  },
];

type AIGInfoModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AIGInfoModal({ open, onClose }: AIGInfoModalProps) {
  const [step, setStep] = useState<number>(0);
  if (!open) return null;
  return (
    <div className="aig-modal-overlay">
      <div className="aig-modal">
        <button className="aig-modal-close" onClick={onClose}>×</button>
        <div className="aig-modal-content">
          <h2>{steps[step].title}</h2>
          <p>{steps[step].text}</p>
        </div>
        <div className="aig-modal-actions">
          <button disabled={step === 0} onClick={() => setStep((s: number) => s - 1)}>Anterior</button>
          <button disabled={step === steps.length - 1} onClick={() => setStep((s: number) => s + 1)}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}

