import { useEffect, useRef, useState } from 'react';
import './DanielaChatbot.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Respuestas predefinidas sobre NEXUS V1
const NEXUS_V1_RESPONSES: Record<string, string> = {
  precio:
    '¡Hola! 👋 NEXUS V1 ofrece 3 planes: Básico (€49/mes), Pro (€149/mes) y Enterprise (€499/mes). Los primeros 3 meses tienen 50% de descuento. ¿Te gustaría saber más sobre algún plan específico?',
  caracteristicas:
    'NEXUS V1 es un cerebro digital que automatiza tu gestión empresarial. Incluye integraciones con más de 50 servicios, IA avanzada, análisis predictivo y automatizaciones ilimitadas. ¿Qué funcionalidad te interesa más?',
  demo: '¡Claro! La mejor forma de entender el poder de NEXUS V1 es verlo en acción. Puedes agendar una demo personalizada aquí: [Link a Calendly]. ¿Te gustaría ver un caso de uso específico?',
  contacto:
    'Puedes escribirnos a contacto@NEXUS V1.com o llamarnos al +34 900 000 000. También estamos en LinkedIn y Twitter como @NEXUS V1_AI. ¿Prefieres que te llamemos nosotros?',
  integraciones:
    'NEXUS V1 se integra con Google Workspace completo (Gmail, Drive, Calendar, Meet, etc.), herramientas de IA como Gemini y Vertex AI, y docenas de servicios más. ¿Necesitas alguna integración específica?',
  ayuda:
    'Estoy aquí para ayudarte con NEXUS V1. Puedo responder sobre:\n• Precios y planes\n• Características del producto\n• Integraciones\n• Solicitar demo\n• Contacto\n\n¿Qué te gustaría saber?',
};

// Teaser messages for the cartoon bubble
const TEASER_MESSAGES = [
  '¡Hola! Soy Daniela 👋 ¿En qué puedo ayudarte?',
  '¿Buscas optimizar tu gestión? 🚀',
  'Tengo ofertas especiales hoy 💎',
  '¿Vemos una demo rápida? 🎥',
  '¡Pregúntame lo que quieras! 💬',
  '¿Problemas con el papeleo? 📄',
];

export default function DanielaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy Daniela, tu asistente virtual de NEXUS V1. ✨ Estoy aquí para llevar tu gestión al siguiente nivel. ¿Hablamos de planes, características o quieres ver una demo?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useProjectContext, setUseProjectContext] = useState(false); // Default false to be faster, user enables for specific questions
  const [teaserIndex, setTeaserIndex] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Phase 2: Rotating Teaser Logic
  useEffect(() => {
    if (isOpen) return;

    // Rotate message every 4 seconds
    const interval = setInterval(() => {
      setTeaserIndex((prev) => (prev + 1) % TEASER_MESSAGES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Phase 2: Random Attention Shake
  useEffect(() => {
    if (isOpen) return;

    // Shake every 10-15 seconds roughly
    const timeout = setInterval(() => {
      if (Math.random() > 0.6) {
        // 40% chance every check
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 900); // Stop shaking after animation
      }
    }, 8000);

    return () => clearInterval(timeout);
  }, [isOpen]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Búsqueda inteligente de palabras clave
    if (
      lowerMessage.includes('precio') ||
      lowerMessage.includes('cost') ||
      lowerMessage.includes('plan')
    ) {
      return NEXUS_V1_RESPONSES.precio;
    }
    if (
      lowerMessage.includes('característic') ||
      lowerMessage.includes('funciona') ||
      lowerMessage.includes('qué es')
    ) {
      return NEXUS_V1_RESPONSES.caracteristicas;
    }
    if (
      lowerMessage.includes('demo') ||
      lowerMessage.includes('probar') ||
      lowerMessage.includes('prueba')
    ) {
      return NEXUS_V1_RESPONSES.demo;
    }
    if (
      lowerMessage.includes('contacto') ||
      lowerMessage.includes('hablar') ||
      lowerMessage.includes('email')
    ) {
      return NEXUS_V1_RESPONSES.contacto;
    }
    if (
      lowerMessage.includes('integra') ||
      lowerMessage.includes('conecta') ||
      lowerMessage.includes('servicio')
    ) {
      return NEXUS_V1_RESPONSES.integraciones;
    }
    if (
      lowerMessage.includes('ayuda') ||
      lowerMessage.includes('hola') ||
      lowerMessage.includes('help')
    ) {
      return NEXUS_V1_RESPONSES.ayuda;
    }

    // Respuesta por defecto
    return 'Interesante pregunta. Puedo ayudarte mejor con información sobre precios, características, demos o contacto. También puedes escribir "ayuda" para ver qué más puedo hacer. ¿Hay algo específico sobre NEXUS V1 que te gustaría saber? 🤔';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular tiempo de respuesta
    // Call Backend API
    try {
      // Determine API URL (use env var or specific port for local dev if needed)
      // Assuming proxy or same-origin for production. For local dev, might need localhost:3000
      const apiUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/ai/generate`
        : 'http://localhost:3000/api/ai/generate';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputValue.trim(),
          useContext: useProjectContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error en el servidor');

      const botResponse: Message = {
        role: 'assistant',
        content: data.text || 'Lo siento, no pude generar una respuesta.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat Error:', error);
      // Fallback to local logic if backend fails (graceful degradation)
      const fallbackResponse = getBotResponse(inputValue);
      const botResponse: Message = {
        role: 'assistant',
        content: `(Modo Offline) ${fallbackResponse}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Cartoon Bubble Teaser */}
      {!isOpen && (
        <div className="cartoon-bubble" key={teaserIndex}>
          {TEASER_MESSAGES[teaserIndex]}
        </div>
      )}

      <button
        className={`chatbot-float-btn ${isOpen ? 'hidden' : ''} ${isShaking ? 'attention-shake' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir chat con Daniela"
      >
        {/* Removed Badge for cleaner character look, or keep if notifications exist */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <img src="/images/daniela.png" alt="Daniela AI" className="chatbot-avatar-btn" />
        </div>
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <img src="/images/daniela.png" alt="Daniela" />
              </div>
              <div className="chatbot-info">
                <h3>Daniela</h3>
                <div className="status">
                  <span className="status-dot"></span>
                  En línea
                </div>
              </div>
            </div>

            {/* Context Toggle */}
            <div
              className="context-toggle"
              title={
                useProjectContext
                  ? 'Desactivar contexto del proyecto'
                  : 'Activar contexto del proyecto (RAG)'
              }
              onClick={() => setUseProjectContext(!useProjectContext)}
              style={{
                marginLeft: 'auto',
                marginRight: '10px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '12px',
                background: useProjectContext ? '#fbbf24' : 'rgba(255,255,255,0.1)', // Gold or Glass
                color: useProjectContext ? '#000' : '#ccc',
                transition: 'all 0.3s',
              }}
            >
              {useProjectContext ? 'RAG ON' : 'RAG OFF'}
            </div>

            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <img src="/images/daniela.png" alt="Daniela" />
                  </div>
                )}
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message message-assistant typing-indicator">
                <div className="message-avatar">
                  <img src="/images/daniela.png" alt="Daniela" />
                </div>
                <div className="message-content">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Escribe tu pregunta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              aria-label="Enviar mensaje"
            >
              ➤
            </button>
          </div>

          <div className="chatbot-footer">
            <p className="powered-by">Powered by NEXUS V1 AI ✨</p>
          </div>
        </div>
      )}
    </>
  );
}
