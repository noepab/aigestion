// Tipos de usuario y roles
export type UserRole = 'admin' | 'developer' | 'analyst' | 'operator' | 'demo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Configuración de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const DASHBOARD_BASE = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173';

// Usuarios de demostración (para desarrollo)
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@nexusv1.net': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'Admin Maestro',
      email: 'admin@nexusv1.net',
      role: 'admin',
      avatar: '👑',
    },
  },
  'dev@nexusv1.net': {
    password: 'dev123',
    user: {
      id: '2',
      name: 'Dev Pro',
      email: 'dev@nexusv1.net',
      role: 'developer',
      avatar: '💻',
    },
  },
  'analyst@nexusv1.net': {
    password: 'analyst123',
    user: {
      id: '3',
      name: 'Analista de Datos',
      email: 'analyst@nexusv1.net',
      role: 'analyst',
      avatar: '📊',
    },
  },
  'ops@nexusv1.net': {
    password: 'ops123',
    user: {
      id: '4',
      name: 'Jefe de Operaciones',
      email: 'ops@nexusv1.net',
      role: 'operator',
      avatar: '🔧',
    },
  },
  'demo@nexusv1.net': {
    password: 'demo123',
    user: {
      id: '5',
      name: 'Cliente Demo',
      email: 'demo@nexusv1.net',
      role: 'demo',
      avatar: '🌟',
    },
  },
};

// URLs de dashboard según rol
const DASHBOARD_URLS: Record<UserRole, string> = {
  admin: `${DASHBOARD_BASE}/god-mode`,
  developer: `${DASHBOARD_BASE}/dashboard?role=developer`,
  analyst: `${DASHBOARD_BASE}/dashboard?role=analyst`,
  operator: `${DASHBOARD_BASE}/dashboard?role=operator`,
  demo: `${DASHBOARD_BASE}/dashboard?role=demo`,
};

/**
 * Servicio de autenticación
 */
class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Cargar token y usuario del localStorage al iniciar
    this.loadFromStorage();
  }

  /**
   * Iniciar sesión
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Intentar autenticación con el backend real
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        this.setAuth(data.token, data.user);
        return data;
      }
    } catch (error) {
      console.warn('Backend no disponible, usando autenticación de demostración');
    }

    // Fallback: Autenticación de demostración
    return this.demoLogin(email, password);
  }

  /**
   * Autenticación de demostración (para desarrollo)
   */
  private async demoLogin(email: string, password: string): Promise<AuthResponse> {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 800));

    const demoUser = DEMO_USERS[email.toLowerCase()];

    if (!demoUser || demoUser.password !== password) {
      throw new Error('Credenciales inválidas');
    }

    const token = `demo_token_${Date.now()}`;
    const authResponse: AuthResponse = {
      user: demoUser.user,
      token,
    };

    this.setAuth(token, demoUser.user);
    return authResponse;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('nexus_v1_token');
    localStorage.removeItem('nexus_v1_user');
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  /**
   * Obtener token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Obtener URL del dashboard según rol
   */
  getDashboardUrl(role?: UserRole): string {
    const userRole = role || this.user?.role || 'demo';
    return DASHBOARD_URLS[userRole];
  }

  /**
   * Redirigir al dashboard correspondiente
   */
  redirectToDashboard(): void {
    if (!this.user) {
      console.error('No hay usuario autenticado');
      return;
    }

    const dashboardUrl = this.getDashboardUrl(this.user.role);

    // Guardar datos del usuario en sessionStorage para que el dashboard los use
    sessionStorage.setItem('nexus_v1_user', JSON.stringify(this.user));
    sessionStorage.setItem('nexus_v1_token', this.token || '');

    // Redirigir
    window.location.href = dashboardUrl;
  }

  /**
   * Guardar autenticación
   */
  private setAuth(token: string, user: User): void {
    this.token = token;
    this.user = user;
    localStorage.setItem('nexus_v1_token', token);
    localStorage.setItem('nexus_v1_user', JSON.stringify(user));
  }

  /**
   * Cargar autenticación desde localStorage
   */
  private loadFromStorage(): void {
    const token = localStorage.getItem('nexus_v1_token');
    const userStr = localStorage.getItem('nexus_v1_user');

    if (token && userStr) {
      try {
        this.token = token;
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error('Error al cargar datos de autenticación:', error);
        this.logout();
      }
    }
  }
}

// Exportar instancia singleton
export const authService = new AuthService();

// Exportar clase para testing
export default AuthService;

