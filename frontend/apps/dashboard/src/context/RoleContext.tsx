import { createContext, ReactNode, useContext, useState } from 'react';

export type UserRole = 'admin' | 'developer' | 'analyst' | 'operator' | 'demo';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface RoleContextType {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Usuarios de demostración
const mockUsers: Record<UserRole, User> = {
  admin: {
    id: '1',
    name: 'Admin Maestro',
    email: 'admin@nexusv1.net',
    role: 'admin',
    avatar: '👑',
  },
  developer: {
    id: '2',
    name: 'Dev Pro',
    email: 'dev@nexusv1.net',
    role: 'developer',
    avatar: '💻',
  },
  analyst: {
    id: '3',
    name: 'Analista de Datos',
    email: 'analista@nexusv1.net',
    role: 'analyst',
    avatar: '📊',
  },
  operator: {
    id: '4',
    name: 'Jefe de Operaciones',
    email: 'ops@nexusv1.net',
    role: 'operator',
    avatar: '🔧',
  },
  demo: {
    id: '5',
    name: 'Cliente Demo',
    email: 'demo@nexusv1.net',
    role: 'demo',
    avatar: '🌟',
  },
};

export function RoleProvider({ children }: { children: ReactNode }) {
  // Intentar cargar usuario autenticado desde sessionStorage (viene del landing-host)
  const loadAuthenticatedUser = (): { role: UserRole; user: User | null } => {
    try {
      const userStr = sessionStorage.getItem('nexus_v1_user');
      const urlParams = new URLSearchParams(window.location.search);
      const roleParam = urlParams.get('role') as UserRole;

      if (userStr) {
        const user: User = JSON.parse(userStr);
        return { role: user.role, user };
      }

      if (roleParam && mockUsers[roleParam]) {
        return { role: roleParam, user: mockUsers[roleParam] };
      }
    } catch (error) {
      console.error('Error al cargar usuario autenticado:', error);
    }

    return { role: 'demo', user: mockUsers.demo };
  };

  const { role: initialRole, user: initialUser } = loadAuthenticatedUser();
  const [role, setRoleState] = useState<UserRole>(initialRole);
  const [user, setUserState] = useState<User | null>(initialUser);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setUserState(mockUsers[newRole]);
  };

  const setUser = (newUser: User) => {
    setUserState(newUser);
    setRoleState(newUser.role);
  };

  const logout = () => {
    setUserState(null);
    setRoleState('demo');
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        setRole,
        setUser,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole debe usarse dentro de un RoleProvider');
  }
  return context;
}

export function useIsRole(requiredRole: UserRole | UserRole[]): boolean {
  const { role } = useRole();
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role);
  }
  return role === requiredRole;
}
