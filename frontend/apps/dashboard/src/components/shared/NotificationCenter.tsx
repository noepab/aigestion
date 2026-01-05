import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  icon?: ReactNode;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const typeStyles = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '✕',
  },
  warning: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    icon: '⚠',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: 'ℹ',
  },
};

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const styles = typeStyles[notification.type];
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification.duration) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          onDismiss(notification.id);
          return 0;
        }
        return prev - (100 / (notification.duration! / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [notification.duration, notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={`
        relative w-80 rounded-lg border backdrop-blur-sm
        ${styles.bg} ${styles.border}
        p-4 shadow-lg overflow-hidden
      `}
    >
      {/* Progress bar */}
      {notification.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <motion.div
            className={`h-full ${styles.text.replace('text-', 'bg-')}`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${styles.text} text-xl flex-shrink-0`}>
          {notification.icon || styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-400">
            {notification.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationCenter({
  notifications,
  onDismiss,
  position = 'top-right',
}: NotificationCenterProps) {
  return (
    <div className={`fixed ${positionStyles[position]} z-50 space-y-2`}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook para usar notificaciones
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: NotificationType,
    title: string,
    message: string,
    duration = 5000
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
    };

    setNotifications((prev) => [...prev, notification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    success: (title: string, message: string, duration?: number) =>
      addNotification('success', title, message, duration),
    error: (title: string, message: string, duration?: number) =>
      addNotification('error', title, message, duration),
    warning: (title: string, message: string, duration?: number) =>
      addNotification('warning', title, message, duration),
    info: (title: string, message: string, duration?: number) =>
      addNotification('info', title, message, duration),
  };
}
