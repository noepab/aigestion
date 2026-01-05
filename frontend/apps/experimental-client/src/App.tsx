import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', padding: 32 }}>
      <header style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ThemeSwitcher />
      </header>
      <main>
        <h1>Bienvenido a NEXUS V1</h1>
        <p>¡Ahora puedes alternar entre modo claro y oscuro!</p>
      </main>
    </div>
  );
};

export default App;

