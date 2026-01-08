import React from 'react';
import {
    LayoutDashboard,
    MessageSquare,
    Settings,
    LogOut,
    Zap,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    TrendingUp,
    BarChart3,
    Box,
    FileSearch,
    ShieldAlert,
    Mic,
    BookOpen,
    ShieldCheck,
    CreditCard,
    Key
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    collapsed?: boolean;
    onClick?: () => void;
    badge?: string | number;
}

const NavItem: React.FC<NavItemProps> = ({
    icon: Icon,
    label,
    active,
    collapsed,
    onClick,
    badge
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center w-full gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                active
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
        >
            <Icon size={20} className={cn(
                "transition-transform duration-200",
                active ? "text-blue-400" : "group-hover:scale-110"
            )} />

            {!collapsed && (
                <span className="text-sm font-medium flex-1 text-left">{label}</span>
            )}

            {!collapsed && badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/20">
                    {badge}
                </span>
            )}

            {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
                    {label}
                </div>
            )}
        </button>
    );
};

export interface NexusSidebarProps {
    activePath?: string;
    onNavigate?: (path: string) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onLogout?: () => void;
}

export const NexusSidebar: React.FC<NexusSidebarProps> = ({
    activePath = '/',
    onNavigate,
    collapsed = false,
    onToggleCollapse,
    onLogout
}) => {
    const navItems = [
        { id: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: '/growth', label: 'Growth', icon: TrendingUp },
        { id: '/analytics', label: 'Analytics', icon: BarChart3 },
        { id: '/chat', label: 'AI Chat', icon: MessageSquare, badge: 'New' },
        { id: '/docker', label: 'Infrastructure', icon: Box },
        { id: '/briefing', label: 'Briefing', icon: FileSearch },
        { id: '/risk-prevention', label: 'Risk Prevention', icon: ShieldAlert },
        { id: '/transcription', label: 'Transcription', icon: Mic },
        { id: '/tutorials', label: 'Tutorials', icon: BookOpen },
        { id: '/credentials', label: 'Credentials', icon: Key },
        { id: '/subscription', label: 'Subscription', icon: CreditCard },
        { id: '/admin', label: 'God Mode', icon: ShieldCheck },
        { id: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className={cn(
            "h-full flex flex-col bg-slate-950/40 backdrop-blur-xl border-r border-white/5 transition-all duration-300 relative",
            collapsed ? "w-20" : "w-64"
        )}>
            {/* Sidebar Toggle */}
            <button
                onClick={onToggleCollapse}
                className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10 shadow-lg"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Header / Logo */}
            <div id="sidebar-logo" className={cn(
                "p-6 flex items-center gap-3",
                collapsed ? "justify-center" : "justify-start"
            )}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Zap size={18} className="text-white fill-white/20" />
                </div>
                {!collapsed && (
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        NEXUS <span className="text-blue-500">V1</span>
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => (
                    <div key={item.id} id={`nav-${item.id.replace('/', '')}`}>
                        <NavItem
                            icon={item.icon}
                            label={item.label}
                            active={activePath === item.id}
                            collapsed={collapsed}
                            badge={item.badge}
                            onClick={() => onNavigate?.(item.id)}
                        />
                    </div>
                ))}
            </nav>

            {/* Premium Upgrade (Only if expanded) */}
            {!collapsed && (
                <div className="px-4 py-4 mt-auto mb-2">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-125 transition-transform">
                            <Sparkles size={40} className="text-blue-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1">Go Premium</h4>
                        <p className="text-[11px] text-slate-400 mb-3">Unlock advanced AI analysis and unlimited seats.</p>
                        <button className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20">
                            Upgrade Now
                        </button>
                    </div>
                </div>
            )}

            {/* Footer / User Profile */}
            <div id="user-profile" className={cn(
                "p-4 border-t border-white/5 flex flex-col gap-4",
                collapsed ? "items-center" : ""
            )}>
                {!collapsed ? (
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=User&background=020617&color=fff" alt="Avatar" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">Alejandro G.</p>
                            <p className="text-xs text-slate-500 truncate">Pro Account</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLogout}
                        className="text-slate-500 hover:text-white transition-colors p-2"
                    >
                        <LogOut size={20} />
                    </button>
                )}
            </div>
        </aside>
    );
};
