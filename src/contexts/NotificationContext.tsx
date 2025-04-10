import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, subscribeToTable } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  user_id: string;
};

export type Reminder = {
  id: string;
  title: string;
  time: string;
  days: string[];
  active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type NotificationContextType = {
  notifications: Notification[];
  reminders: Reminder[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createReminder: (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateReminder: (id: string, data: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  checkReminders: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notifications when user logs in
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    };

    const fetchReminders = async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reminders:', error);
        return;
      }

      setReminders(data || []);
    };

    fetchNotifications();
    fetchReminders();

    // Subscribe to real-time notifications
    const unsubscribeNotifications = subscribeToTable(
      'notifications',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          
          // Show toast for new notification
          toast.message(payload.new.title, {
            description: payload.new.message,
          });
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? (payload.new as Notification) : n)
          );
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => 
            prev.filter(n => n.id !== payload.old.id)
          );
        }
      }
    );

    // Subscribe to real-time reminders
    const unsubscribeReminders = subscribeToTable(
      'reminders',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setReminders(prev => [payload.new as Reminder, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setReminders(prev => 
            prev.map(r => r.id === payload.new.id ? (payload.new as Reminder) : r)
          );
        } else if (payload.eventType === 'DELETE') {
          setReminders(prev => 
            prev.filter(r => r.id !== payload.old.id)
          );
        }
      }
    );

    // Set up reminder interval check
    const reminderInterval = setInterval(() => {
      checkReminders();
    }, 60000); // Check every minute

    return () => {
      unsubscribeNotifications();
      unsubscribeReminders();
      clearInterval(reminderInterval);
    };
  }, [user]);

  const checkReminders = () => {
    if (!reminders.length) return;

    const now = new Date();
    const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    reminders.forEach(reminder => {
      if (!reminder.active) return;
      
      if (reminder.days.includes(currentDay) && reminder.time === currentTime) {
        toast.message(`Reminder: ${reminder.title}`, {
          description: "It's time for your scheduled activity!",
        });
      }
    });
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const createReminder = async (reminder: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { error } = await supabase
      .from('reminders')
      .insert({
        ...reminder,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create reminder');
      return;
    }

    toast.success('Reminder created successfully');
  };

  const updateReminder = async (id: string, data: Partial<Reminder>) => {
    if (!user) return;

    const { error } = await supabase
      .from('reminders')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
      return;
    }

    toast.success('Reminder updated successfully');
  };

  const deleteReminder = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
      return;
    }

    toast.success('Reminder deleted successfully');
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        reminders,
        unreadCount, 
        markAsRead, 
        markAllAsRead,
        createReminder,
        updateReminder,
        deleteReminder,
        checkReminders
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}; 