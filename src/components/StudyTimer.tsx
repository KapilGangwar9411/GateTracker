import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, RotateCcw, Bell, Droplets, Coffee, Calendar, BarChart, X, Move, Timer as TimerIcon, Clock, LineChart, Flame, Brain, Sparkles, Medal, Lightbulb, Zap, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, subDays, startOfDay, endOfDay, subMonths, subYears, isWithinInterval } from 'date-fns';

// Extend Window interface to include our session tracker
declare global {
  interface Window {
    _studySessionTracker?: {[key: string]: boolean};
  }
}

// Initialize study session tracker if not already present
if (typeof window !== 'undefined') {
  window._studySessionTracker = window._studySessionTracker || {};
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const REMINDER_MESSAGES = [
  { icon: <Droplets className="h-5 w-5 mr-2" />, message: "Time to hydrate! Drink some water." },
  { icon: <Coffee className="h-5 w-5 mr-2" />, message: "Take a short break to rest your eyes." },
  { icon: <Bell className="h-5 w-5 mr-2" />, message: "Stand up and stretch for a minute." }
] as const;

type ReminderMessage = typeof REMINDER_MESSAGES[number];

// Web Audio API sound generator
const playSound = (type: 'reminder' | 'completion') => {
  try {
    // Define AudioContext for TypeScript
    type AudioContextType = typeof window.AudioContext;
    const AudioContext = window.AudioContext || 
      (typeof window !== 'undefined' ? 
        ((window as { webkitAudioContext?: AudioContextType }).webkitAudioContext as AudioContextType) : 
        null);
    
    if (!AudioContext) {
      console.error('Web Audio API not supported in this browser');
      return;
    }
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Connect the nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set properties based on sound type
    if (type === 'reminder') {
      // Higher pitched, shorter beep
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = 0.2; // 20% volume
      
      oscillator.start();
      
      // Fade out for a nicer sound
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      // Stop after 0.5 seconds
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    } else {
      // Completion sound (two tones)
      oscillator.type = 'sine';
      oscillator.frequency.value = 587.33; // D5 note
      gainNode.gain.value = 0.2;
      
      oscillator.start();
      
      // Transition to a higher note 
      setTimeout(() => {
        oscillator.frequency.value = 880; // A5 note
      }, 200);
      
      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
      
      // Stop after 0.8 seconds
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 800);
    }
  } catch (err) {
    console.error('Error playing sound:', err);
  }
};

// Floating Timer Component
const FloatingTimer = ({ 
  time, 
  isActive, 
  activeTab, 
  onToggleTimer, 
  onResetTimer, 
  onClose 
}: { 
  time: number; 
  isActive: boolean; 
  activeTab: string;
  onToggleTimer: () => void; 
  onResetTimer: () => void;
  onClose: () => void;
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const timerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={timerRef}
      className={`fixed z-50 bg-card border rounded-lg shadow-md p-2 w-32 transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="drag-handle cursor-grab flex items-center">
          <Move className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="text-xs font-medium">
          {activeTab === "pomodoro" ? "Study" : "Break"}
        </div>
        <button 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      <div className="text-center mb-2">
        <div className="text-xl font-bold">{formatTime(time)}</div>
      </div>
      
      <div className="flex justify-center space-x-1">
        <Button 
          onClick={onToggleTimer}
          size="sm"
          className={`h-7 w-7 rounded-full p-0 ${isActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>
        
        <Button 
          onClick={onResetTimer}
          size="sm"
          variant="outline"
          className="h-7 w-7 rounded-full p-0"
          disabled={!isActive}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Add this timer state interface after the REMINDER_MESSAGES declaration
interface TimerState {
  isActive: boolean;
  activeTab: string;
  time: number;
  selectedTime: string;
  cycles: number;
  sessionStartTime: number | null;
  targetEndTime: number | null;
  nextReminderTime: number | null;
  reminderInterval: string;
  sessionSaved: boolean;
  currentSessionId: string | null;
}

// Add this interface below the TimerState interface
interface SavedSessions {
  [key: string]: boolean;
}

const StudyTimer = () => {
  const { user } = useAuth();
  
  // Load persisted timer state from localStorage
  const loadTimerState = (): TimerState | null => {
    try {
      const savedState = localStorage.getItem('timerState');
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (e) {
      console.error('Error loading timer state:', e);
    }
    return null;
  };
  
  // Get persisted state or initialize with defaults
  const persistedState = loadTimerState();
  
  const [activeTab, setActiveTab] = useState(persistedState?.activeTab || "pomodoro");
  const [isActive, setIsActive] = useState(false); // Start as inactive, we'll check in useEffect
  const [time, setTime] = useState(persistedState?.time || 1500); // 25 minutes in seconds
  const [selectedTime, setSelectedTime] = useState(persistedState?.selectedTime || "25");
  const [reminderInterval, setReminderInterval] = useState(persistedState?.reminderInterval || "15"); // Reminder interval in minutes
  const [cycles, setCycles] = useState(persistedState?.cycles || 0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(persistedState?.sessionStartTime || null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<ReminderMessage>(REMINDER_MESSAGES[0]);
  const [nextReminderTime, setNextReminderTime] = useState<number | null>(persistedState?.nextReminderTime || null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historicalData, setHistoricalData] = useState<{ date: string; duration: number }[]>([]);
  const [dateRange, setDateRange] = useState("30"); // Default to 30 days
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(persistedState?.sessionSaved || false); // Track if current session has been saved
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(persistedState?.currentSessionId || null); // Track unique session ID

  // Add these new state variables and refs
  const timerStartRef = useRef<number | null>(persistedState?.targetEndTime ? Date.now() - ((persistedState.targetEndTime - Date.now()) - persistedState.time * 1000) : null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const targetEndTimeRef = useRef<number | null>(persistedState?.targetEndTime || null);
  const initialDurationRef = useRef<number>(persistedState?.time || 1500);

  // Add this function to check if a session is saved
  const isSessionSaved = (sessionId: string): boolean => {
    try {
      const savedData = localStorage.getItem('savedStudySessions');
      if (savedData) {
        const savedSessions = JSON.parse(savedData) as SavedSessions;
        return !!savedSessions[sessionId];
      }
    } catch (e) {
      console.error('Error checking saved session:', e);
    }
    return false;
  };

  // Add this function to mark a session as saved
  const markSessionSaved = (sessionId: string): void => {
    try {
      const savedData = localStorage.getItem('savedStudySessions');
      const savedSessions: SavedSessions = savedData ? JSON.parse(savedData) : {};
      savedSessions[sessionId] = true;
      localStorage.setItem('savedStudySessions', JSON.stringify(savedSessions));
      console.log(`Marked session ${sessionId} as saved in localStorage`);
    } catch (e) {
      console.error('Error marking session as saved:', e);
    }
  };

  // Add this function to remove a session from saved
  const removeSessionSaved = (sessionId: string): void => {
    try {
      const savedData = localStorage.getItem('savedStudySessions');
      if (savedData) {
        const savedSessions = JSON.parse(savedData) as SavedSessions;
        delete savedSessions[sessionId];
        localStorage.setItem('savedStudySessions', JSON.stringify(savedSessions));
      }
    } catch (e) {
      console.error('Error removing saved session:', e);
    }
  };

  // Add this function to clear saved sessions older than 24 hours
  const clearOldSavedSessions = (): void => {
    try {
      const savedData = localStorage.getItem('savedStudySessions');
      if (savedData) {
        const savedSessions = JSON.parse(savedData) as SavedSessions;
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        let hasChanges = false;
        for (const sessionId in savedSessions) {
          // Extract timestamp from session ID (assuming format: uid_timestamp)
          const parts = sessionId.split('_');
          if (parts.length > 1) {
            const timestamp = parseInt(parts[parts.length - 1]);
            if (!isNaN(timestamp) && timestamp < oneDayAgo) {
              delete savedSessions[sessionId];
              hasChanges = true;
            }
          }
        }
        
        if (hasChanges) {
          localStorage.setItem('savedStudySessions', JSON.stringify(savedSessions));
          console.log('Cleared old saved sessions from localStorage');
        }
      }
    } catch (e) {
      console.error('Error clearing old saved sessions:', e);
    }
  };

  // Save timer state to localStorage
  const saveTimerState = () => {
    try {
      const stateToSave: TimerState = {
        isActive,
        activeTab,
        time,
        selectedTime,
        cycles,
        sessionStartTime,
        targetEndTime: targetEndTimeRef.current,
        nextReminderTime,
        reminderInterval,
        sessionSaved,
        currentSessionId
      };
      localStorage.setItem('timerState', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving timer state:', e);
    }
  };

  // Activate timer on component mount if it was active before
  useEffect(() => {
    if (persistedState?.isActive && targetEndTimeRef.current !== null) {
      // Calculate the correct remaining time
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));
      
      if (remaining > 0) {
        setTime(remaining);
        setIsActive(true);
      } else {
        // Timer would have finished while away
        setTime(0);
      }
    }
  }, []);

  // Save timer state whenever key values change
  useEffect(() => {
    saveTimerState();
  }, [isActive, time, activeTab, selectedTime, cycles, sessionStartTime, nextReminderTime, sessionSaved, currentSessionId]);

  // Clean up timer state when component unmounts
  useEffect(() => {
    return () => {
      // Only update localStorage, don't clear it
      if (isActive) {
        saveTimerState();
      }
    };
  }, [isActive]);

  // Fetch today's study sessions
  const { data: todaySessions, refetch: refetchSessions } = useQuery({
    queryKey: ['study-sessions', user?.id, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user) return null;
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Error fetching sessions', { description: error.message });
        throw error;
      }
      
      return data;
    },
    enabled: !!user
  });

  // Fetch historical study sessions
  const { data: historicalSessions, refetch: refetchHistorical } = useQuery({
    queryKey: ['historical-sessions', user?.id, dateRange, customDateRange],
    queryFn: async () => {
      if (!user) return null;
      
      let startDate: Date;
      
      // Determine start date based on selected range
      switch (dateRange) {
        case "7":
          startDate = subDays(new Date(), 7);
          break;
        case "30":
          startDate = subDays(new Date(), 30);
          break;
        case "90":
          startDate = subDays(new Date(), 90);
          break;
        case "180":
          startDate = subDays(new Date(), 180);
          break;
        case "365":
          startDate = subDays(new Date(), 365);
          break;
        case "custom":
          if (customDateRange.start) {
            startDate = customDateRange.start;
          } else {
            startDate = subDays(new Date(), 30); // Default if no custom date selected
          }
          break;
        default:
          startDate = subDays(new Date(), 30);
      }
      
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Error fetching historical data', { description: error.message });
        throw error;
      }
      
      // Filter by custom date range if selected
      let filteredData = data;
      if (dateRange === "custom" && customDateRange.start && customDateRange.end) {
        filteredData = data.filter(session => {
          const sessionDate = new Date(session.created_at);
          return isWithinInterval(sessionDate, { 
            start: customDateRange.start, 
            end: customDateRange.end 
          });
        });
      }
      
      // Group sessions by date
      const groupedData = filteredData.reduce((acc: { [key: string]: number }, session) => {
        const date = format(new Date(session.created_at), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + session.duration;
        return acc;
      }, {});
      
      // Convert to array format
      const historicalArray = Object.entries(groupedData).map(([date, duration]) => ({
        date,
        duration
      }));
      
      return historicalArray;
    },
    enabled: !!user
  });

  // Calculate today's total study time
  useEffect(() => {
    if (todaySessions) {
      const total = todaySessions.reduce((sum, session) => sum + session.duration, 0);
      setTotalStudyTime(total);
    }
  }, [todaySessions]);

  // Update historical data when sessions change
  useEffect(() => {
    if (historicalSessions) {
      setHistoricalData(historicalSessions);
    }
  }, [historicalSessions]);

  // Save a study session
  const saveSession = useMutation({
    mutationFn: async (duration: number) => {
      if (!user) return;
      
      // Clear old sessions first to prevent localStorage bloat
      clearOldSavedSessions();
      
      // Generate a session ID if one doesn't exist yet
      const sessionId = currentSessionId || `${user.id}_${Date.now()}`;
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }
      
      // Check if this session has already been saved
      if (isSessionSaved(sessionId)) {
        console.log(`Session ${sessionId} already saved, skipping save`);
        return;
      }
      
      console.log(`Saving session ${sessionId} with duration ${duration} seconds`);
      
      try {
        // Mark the session as saved BEFORE database operation to prevent race conditions
        markSessionSaved(sessionId);
        
        // Track this as a completed cycle in localStorage
        if (cycles > 0) {
          try {
            const completedCycles = localStorage.getItem('completedCycles') ? 
              JSON.parse(localStorage.getItem('completedCycles') || '[]') : [];
            
            completedCycles.push({
              sessionId,
              timestamp: Date.now(),
              duration
            });
            
            // Only keep the most recent 100 cycles
            if (completedCycles.length > 100) {
              completedCycles.splice(0, completedCycles.length - 100);
            }
            
            localStorage.setItem('completedCycles', JSON.stringify(completedCycles));
            console.log('Tracked completed cycle in localStorage');
          } catch (e) {
            console.error('Error tracking cycle in localStorage:', e);
          }
        }
        
        // Insert into database - only using fields that exist in the schema
        const { data, error } = await supabase
          .from('study_sessions')
          .insert({
            user_id: user.id,
            duration: duration,
            session_date: format(new Date(), 'yyyy-MM-dd')
            // Removed is_completed_cycle field as it doesn't exist in the database
          })
          .select();
        
        if (error) {
          // Remove from saved sessions if there was an error
          removeSessionSaved(sessionId);
          console.error('Database error:', error);
          toast.error('Error saving study session', { description: error.message });
          throw error;
        } else {
          toast.success('Study session saved', { description: `You studied for ${formatStudyTimeForDisplay(duration)}` });
          console.log('Session saved to database:', data);
          refetchSessions();
          refetchHistorical();
        }
      } catch (err) {
        console.error('Error in saveSession mutation:', err);
        removeSessionSaved(sessionId);
        toast.error('Error saving study session', { description: 'Please try again' });
      }
    }
  });

  // Handle visibility change for floating timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setShowFloatingTimer(true);
      } else if (!document.hidden) {
        setShowFloatingTimer(false);
      }
    };

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check if document is already hidden when component mounts or isActive changes
    if (document.hidden && isActive) {
      setShowFloatingTimer(true);
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  // Handle window focus/blur for floating timer
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isActive) {
        setShowFloatingTimer(false);
      }
    };

    const handleWindowBlur = () => {
      if (isActive) {
        setShowFloatingTimer(true);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive]);

  // Timer logic - replacing the previous timer useEffect
  useEffect(() => {
    let interval: number | undefined;
    
    if (isActive && time > 0) {
      // Store initial timer values when starting
      if (timerStartRef.current === null) {
        timerStartRef.current = Date.now();
        lastUpdateTimeRef.current = Date.now();
        initialDurationRef.current = time;
        
        // Calculate end time (when timer should reach 0)
        targetEndTimeRef.current = Date.now() + time * 1000;
      }
      
      interval = window.setInterval(() => {
        const now = Date.now();
        
        // First approach: Calculate time based on elapsed time since timer started
        if (targetEndTimeRef.current !== null) {
          const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));
          setTime(remaining);
          
          // Update last check time
          lastUpdateTimeRef.current = now;
        }
        
        // Handle timer completion
        if (time <= 0) {
          clearInterval(interval);
          // Reset our refs
          timerStartRef.current = null;
          targetEndTimeRef.current = null;
        }
      }, 500); // Update more frequently for better responsiveness
    } else if (time === 0) {
      // Timer finished - reset our refs
      timerStartRef.current = null;
      targetEndTimeRef.current = null;
      
      // Timer finished
      setIsActive(false);
      
      if (activeTab === "pomodoro" && sessionStartTime !== null) {
        // Calculate the actual study duration in minutes
        const sessionDuration = parseInt(selectedTime) * 60;
        
        // Generate a unique ID for this completed session if not already set
        if (!currentSessionId) {
          const newSessionId = `${user?.id || 'anon'}_${Date.now()}`;
          setCurrentSessionId(newSessionId);
        }
        
        // Clear sessionSaved flag to ensure we attempt to save this session
        setSessionSaved(false);
        
        // Get the current session ID (either existing or newly generated)
        const sessionId = currentSessionId || `${user?.id || 'anon'}_${Date.now()}`;
        
        // Only check if already saved as a safety mechanism
        if (!isSessionSaved(sessionId)) {
          saveSession.mutate(sessionDuration);
          setSessionSaved(true);
        } else {
          console.log(`Session ${sessionId} already saved when timer finished, skipping save`);
        }
        
        setSessionStartTime(null);
        
        // Play the completion sound
        playSound('completion');
        
        // Try to show browser notification
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Study Timer Complete', {
              body: 'Your study session has completed!',
              icon: '/favicon.ico'
            });
          }
        } catch (err) {
          console.error('Error showing notification:', err);
        }
      }
      
      if (activeTab === "pomodoro") {
        // Switch to break
        const newCycles = cycles + 1;
        setCycles(newCycles);
        
        // Save to localStorage immediately
        try {
          localStorage.setItem('studyCycles', newCycles.toString());
        } catch (e) {
          console.error('Error saving cycles:', e);
        }
        
        setActiveTab("break");
        setTime(300); // 5 min break
        
        toast.success('Study session completed!', {
          description: 'Time for a break. Stretch, hydrate, and rest your eyes.',
          duration: 5000,
        });
      } else {
        // Switch back to pomodoro
        setActiveTab("pomodoro");
        setTime(parseInt(selectedTime) * 60);
        
        // Play completion sound again when break is over
        playSound('completion');
        
        toast.info('Break time finished', {
          description: 'Ready to get back to studying?',
          duration: 5000,
        });
      }
    }
    
    // Handle reminders
    if (isActive && activeTab === "pomodoro" && nextReminderTime !== null && Date.now() >= nextReminderTime) {
      // Show reminder
      const randomIndex = Math.floor(Math.random() * REMINDER_MESSAGES.length);
      setReminderMessage(REMINDER_MESSAGES[randomIndex]);
      setShowReminder(true);
      
      // Play reminder sound
      playSound('reminder');
      
      // Schedule next reminder
      setNextReminderTime(Date.now() + parseInt(reminderInterval) * 60 * 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, time, activeTab, selectedTime, sessionStartTime, saveSession, reminderInterval, nextReminderTime, sessionSaved, currentSessionId, user, cycles]);

  // Add a new effect to sync timer on visibility changes
  useEffect(() => {
    // Function to handle when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        // Tab is visible again, recalculate the timer
        if (targetEndTimeRef.current !== null) {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((targetEndTimeRef.current - now) / 1000));
          
          // If timer should have completed while away, trigger completion
          if (remaining <= 0) {
            setTime(0);
          } else {
            setTime(remaining);
          }
        }
      }
    };

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  const toggleTimer = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    
    if (newIsActive) {
      // Starting the timer
      
      // If the timer was paused, adjust the target end time
      if (targetEndTimeRef.current !== null && time > 0) {
        targetEndTimeRef.current = Date.now() + time * 1000;
      } 
      else {
        // Fresh timer start
        timerStartRef.current = Date.now();
        lastUpdateTimeRef.current = Date.now();
        targetEndTimeRef.current = Date.now() + time * 1000;
        initialDurationRef.current = time;
      }
      
      // If starting a pomodoro timer, record the start time
      if (activeTab === "pomodoro" && !sessionStartTime) {
        const now = Date.now();
        setSessionStartTime(now);
        setSessionSaved(false);
        
        // Create a new session ID when starting a new timer
        const newSessionId = `${user?.id || 'anon'}_${now}`;
        setCurrentSessionId(newSessionId);
        
        // Schedule first reminder
        setNextReminderTime(Date.now() + parseInt(reminderInterval) * 60 * 1000);
        
        // Request notification permission if needed
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              toast.success('Notifications enabled', { 
                description: 'You will receive notifications when your timer completes'
              });
            }
          });
        }
        
        // Show notification that timer has started
        toast.info('Timer started', {
          description: `Next reminder in ${reminderInterval} minutes`,
          duration: 3000,
        });
        
        // Check if document is hidden when timer starts
        if (document.hidden) {
          setShowFloatingTimer(true);
        }
      }
    } else {
      // Pausing the timer - we'll keep targetEndTimeRef as is
      // This will allow us to resume from the correct point
      
      // Save partial study time when pausing
      if (activeTab === "pomodoro" && 
          sessionStartTime !== null && 
          !sessionSaved &&
          time < parseInt(selectedTime) * 60 - 10) {  // Only save if at least 10 seconds elapsed
        
        const sessionDuration = parseInt(selectedTime) * 60 - time;
        if (sessionDuration > 10) {
          // Check if this session has already been saved
          const sessionId = currentSessionId || `${user?.id || 'anon'}_${sessionStartTime}`;
          if (!isSessionSaved(sessionId)) {
            setSessionSaved(true);
            saveSession.mutate(sessionDuration);
          } else {
            console.log(`Session ${sessionId} already saved during pause, skipping save`);
          }
        }
      }
    }
  };
  
  const resetTimer = () => {
    if (isActive && 
        activeTab === "pomodoro" && 
        sessionStartTime !== null && 
        !sessionSaved && 
        time < parseInt(selectedTime) * 60 - 10) {
      
      const sessionDuration = parseInt(selectedTime) * 60 - time;
      if (sessionDuration > 10) { // Only save if at least 10 seconds elapsed
        // Check if this session has already been saved
        const sessionId = currentSessionId || `${user?.id || 'anon'}_${sessionStartTime}`;
        if (!isSessionSaved(sessionId)) {
          setSessionSaved(true);
          saveSession.mutate(sessionDuration);
        } else {
          console.log(`Session ${sessionId} already saved during reset, skipping save`);
        }
      }
    }
    
    setIsActive(false);
    setSessionStartTime(null);
    setNextReminderTime(null);
    setSessionSaved(false);
    setCurrentSessionId(null); // Reset session ID on timer reset
    
    // Reset timer refs
    timerStartRef.current = null;
    targetEndTimeRef.current = null;
    
    if (activeTab === "pomodoro") {
      setTime(parseInt(selectedTime) * 60);
    } else {
      setTime(300); // 5 min for break
    }
  };

  const handleTimeChange = (value: string) => {
    setSelectedTime(value);
    if (!isActive) {
      setTime(parseInt(value) * 60);
    }
  };

  const handleTabChange = (value: string) => {
    // Only save session if it's an active pomodoro timer and significant time has passed
    if (activeTab === "pomodoro" && 
        isActive && 
        sessionStartTime !== null && 
        !sessionSaved && 
        time < parseInt(selectedTime) * 60 - 10) {
      
      const sessionDuration = parseInt(selectedTime) * 60 - time;
      if (sessionDuration > 10) { // Only save if at least 10 seconds elapsed
        // Check if this session has already been saved
        const sessionId = currentSessionId || `${user?.id || 'anon'}_${sessionStartTime}`;
        if (!isSessionSaved(sessionId)) {
          setSessionSaved(true);
          saveSession.mutate(sessionDuration);
        } else {
          console.log(`Session ${sessionId} already saved during tab change, skipping save`);
        }
      }
    }
    
    setActiveTab(value);
    setIsActive(false);
    setSessionStartTime(null);
    setNextReminderTime(null);
    setSessionSaved(false);
    setCurrentSessionId(null); // Reset session ID on tab change
    
    if (value === "pomodoro") {
      setTime(parseInt(selectedTime) * 60);
    } else {
      setTime(300); // 5 min break
    }
  };
  
  // Format study time for display
  const formatStudyTimeForDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const toggleFloatingTimer = () => {
    setShowFloatingTimer(!showFloatingTimer);
  };

  const closeFloatingTimer = () => {
    setShowFloatingTimer(false);
  };

  // Calculate total study time for the selected period
  const totalHistoricalStudyTime = historicalData.reduce((sum, day) => sum + day.duration, 0);
  
  // Calculate average study time per day
  const averageStudyTimePerDay = historicalData.length > 0 
    ? Math.round(totalHistoricalStudyTime / historicalData.length) 
    : 0;

  // Add a new effect for cycles persistence
  useEffect(() => {
    // Save cycles count to localStorage whenever it changes
    try {
      localStorage.setItem('studyCycles', cycles.toString());
    } catch (e) {
      console.error('Error saving cycles:', e);
    }
  }, [cycles]);

  // Load cycles from localStorage on mount
  useEffect(() => {
    try {
      const savedCycles = localStorage.getItem('studyCycles');
      if (savedCycles) {
        setCycles(parseInt(savedCycles));
      }
    } catch (e) {
      console.error('Error loading cycles:', e);
    }
  }, []);

  // Clear old saved sessions on component mount
  useEffect(() => {
    clearOldSavedSessions();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero header section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-2xl p-6 shadow-lg overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#smallGrid)" />
          </svg>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 mb-1">
              <TimerIcon className="h-5 w-5" />
              <h1 className="text-2xl font-bold tracking-tight">Focus Timer</h1>
            </div>
            <p className="text-sm text-white/80 max-w-md">
              Break down your study sessions into focused intervals to improve concentration and reduce mental fatigue.
            </p>
            
            <div className="flex space-x-3 pt-2">
          <Button 
                onClick={toggleFloatingTimer} 
            variant="outline" 
            size="sm" 
                className="text-xs bg-white/10 border-white/20 hover:bg-white/20 text-white"
          >
                {showFloatingTimer ? "Hide" : "Show"} Floating Timer
          </Button>
              <Dialog>
            <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    <BarChart className="h-3.5 w-3.5 mr-1.5" />
                    Study Stats
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                    <DialogTitle>Study Statistics</DialogTitle>
              </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium">Time Period</h4>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant={dateRange === '7' ? "default" : "outline"} 
                            className="h-7 text-xs px-2"
                            onClick={() => setDateRange('7')}
                          >
                            Week
                          </Button>
                          <Button 
                            size="sm" 
                            variant={dateRange === '30' ? "default" : "outline"} 
                            className="h-7 text-xs px-2"
                            onClick={() => setDateRange('30')}
                          >
                            Month
                          </Button>
                          <Button 
                            size="sm" 
                            variant={dateRange === '365' ? "default" : "outline"} 
                            className="h-7 text-xs px-2"
                            onClick={() => setDateRange('365')}
                          >
                            Year
                          </Button>
                  </div>
                </div>
                
                      {selectedDate && (
                        <div className="text-xs text-right">
                          <p className="text-muted-foreground">Selected Date</p>
                          <p className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
                    </div>
                  )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 shadow-sm">
                        <p className="text-muted-foreground mb-1">Total Study Time</p>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatStudyTimeForDisplay(totalHistoricalStudyTime)}</p>
                    </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 shadow-sm">
                        <p className="text-muted-foreground mb-1">Average Per Day</p>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatStudyTimeForDisplay(averageStudyTimePerDay)}</p>
                    </div>
                  </div>
                  
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg shadow-sm p-3">
                      <h4 className="text-xs font-medium mb-2 flex items-center justify-between">
                        <span>Session History</span>
                        <span className="text-xs text-muted-foreground">Click on a day to view details</span>
                      </h4>
                  <div className="h-40 overflow-y-auto space-y-1">
                    {historicalData.length > 0 ? (
                      historicalData.map((day) => (
                        <div 
                          key={day.date} 
                              className={`flex justify-between items-center text-xs p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${selectedDate && format(selectedDate, 'yyyy-MM-dd') === day.date ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                          onClick={() => setSelectedDate(new Date(day.date))}
                        >
                          <span className="font-medium">
                                {format(new Date(day.date), 'EEE, MMM dd')}
                          </span>
                              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {formatStudyTimeForDisplay(day.duration)}
                          </span>
                        </div>
                      ))
                    ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No study data available for the selected period</p>
                          </div>
                    )}
                  </div>
                </div>
                
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg shadow-sm p-3">
                      <h4 className="text-xs font-medium mb-2">Today's Sessions</h4>
                  {todaySessions && todaySessions.length > 0 ? (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {todaySessions.map((session, index) => (
                            <div key={session.id} className="flex justify-between items-center text-xs p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                              <div className="flex items-center">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mr-2">
                                  {index + 1}
                                </div>
                                <span className="text-slate-600 dark:text-slate-300">
                            {new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                              </div>
                              <span className="font-medium text-indigo-600 dark:text-indigo-400">{formatStudyTimeForDisplay(session.duration)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No study sessions recorded today</p>
                          <p className="text-xs mt-1">Start your timer to begin studying</p>
                        </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5 min-w-[110px]">
              <p className="text-xs text-indigo-200 mb-1">Today's Study</p>
              <p className="text-xl font-bold">{formatStudyTimeForDisplay(totalStudyTime)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5 min-w-[110px]">
              <p className="text-xs text-indigo-200 mb-1">Completed Cycles</p>
              <p className="text-xl font-bold">{cycles}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5 min-w-[110px]">
              <p className="text-xs text-indigo-200 mb-1">Daily Average</p>
              <p className="text-xl font-bold">{formatStudyTimeForDisplay(averageStudyTimePerDay)}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Timer column */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-md relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-50/50 dark:bg-indigo-900/10 blur-3xl"></div>
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-violet-50/50 dark:bg-violet-900/10 blur-3xl"></div>
            
            <div className="relative grid md:grid-cols-2 gap-8">
              {/* Timer circle */}
              <div className="flex flex-col justify-center items-center space-y-6">
                <div className="relative w-52 h-52 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-inner"></div>
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-100 dark:text-slate-700"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="46"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={`${activeTab === 'pomodoro' ? 'text-indigo-500' : 'text-blue-500'} transition-all duration-1000 ease-in-out`}
                      strokeWidth="7"
                      strokeDasharray={289}
                      strokeDashoffset={289 - (289 * (1 - time / (parseInt(selectedTime) * 60)))}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="46"
                      cx="50"
                      cy="50"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-5xl font-bold text-slate-800 dark:text-slate-100">{formatTime(time)}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {activeTab === 'pomodoro' ? 'Focus Time' : 'Break Time'}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant={isActive ? "outline" : "default"}
                    size="lg" 
                    className={`h-14 w-14 rounded-full ${isActive 
                      ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-900/30 animate-pulse' 
                      : 'bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20 border-0'}`}
                    onClick={toggleTimer}
                    disabled={saveSession.isPending}
                  >
                    {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 w-14 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm"
                    onClick={resetTimer}
                    disabled={saveSession.isPending || !isActive}
                  >
                    <RotateCcw className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              
              {/* Settings panel */}
              <div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100/50 dark:bg-slate-800/50">
                    <TabsTrigger value="pomodoro" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white text-sm py-2">
                      <Clock className="h-4 w-4 mr-2" />
                      Study Session
              </TabsTrigger>
                    <TabsTrigger value="break" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white text-sm py-2">
                      <Coffee className="h-4 w-4 mr-2" />
                      Break Time
              </TabsTrigger>
            </TabsList>
            
                  <TabsContent value="pomodoro" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Study Duration</label>
                <Select value={selectedTime} onValueChange={handleTimeChange} disabled={isActive}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-sm border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Study Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 minutes</SelectItem>
                    <SelectItem value="25">25 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Reminder Interval</label>
                <Select value={reminderInterval} onValueChange={setReminderInterval} disabled={isActive}>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-800 text-sm border-slate-200 dark:border-slate-700">
                            <SelectValue placeholder="Remind Every" />
                  </SelectTrigger>
                  <SelectContent>
                            <SelectItem value="5">5 min reminder</SelectItem>
                            <SelectItem value="10">10 min reminder</SelectItem>
                            <SelectItem value="15">15 min reminder</SelectItem>
                            <SelectItem value="20">20 min reminder</SelectItem>
                            <SelectItem value="30">30 min reminder</SelectItem>
                  </SelectContent>
                </Select>
                      </div>
                      
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800/30">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">Focus Tips</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Eliminate distractions and set clear goals for each session</p>
                          </div>
                        </div>
                      </div>
              </div>
            </TabsContent>
            
            <TabsContent value="break">
                    <div className="text-center space-y-5">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800/30">
                        <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-400">Recharge your mental energy</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Use these short breaks to rest and prepare for your next focused session</p>
                  </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                          <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm font-medium">Stay hydrated</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Drink water regularly</p>
                  </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                          <Coffee className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                          <p className="text-sm font-medium">Rest your eyes</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Look away from screen</p>
                  </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                          <Bell className="h-6 w-6 mx-auto mb-2 text-violet-500" />
                          <p className="text-sm font-medium">Stretch</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Move your body</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                          <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                          <p className="text-sm font-medium">Plan ahead</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Review your goals</p>
                  </div>
                </div>
              </div>
            </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        
        {/* Study tips column */}
        <div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <h3 className="font-medium">Effective Study Strategies</h3>
                </div>
              </div>
              
            <div className="p-4 space-y-4">
              <div className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Flame className="h-4 w-4 text-red-500" />
                  </div>
                  <h4 className="font-medium text-sm">The Pomodoro Technique</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Break your study sessions into focused intervals (25 minutes) with short breaks to improve concentration.</p>
              </div>
              
              <div className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Droplets className="h-4 w-4 text-blue-500" />
                  </div>
                  <h4 className="font-medium text-sm">Stay Hydrated</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Drinking water regularly helps maintain cognitive function and improves brain performance.</p>
              </div>
              
              <div className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Coffee className="h-4 w-4 text-amber-500" />
                  </div>
                  <h4 className="font-medium text-sm">Reduce Eye Strain</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Apply the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds.</p>
              </div>
              
              <div className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Brain className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h4 className="font-medium text-sm">Active Recall</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Test yourself regularly instead of passively reviewing to strengthen memory retention.</p>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                  <Medal className="h-4 w-4" />
                  <p className="text-xs font-medium">Consistency builds results</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={toggleFloatingTimer}
                >
                  {showFloatingTimer ? "Hide" : "Show"} Mini Timer
                </Button>
              </div>
            </div>
              </div>
                </div>
            </div>
      
      {/* Floating Timer */}
      <FloatingTimer 
        time={time}
        isActive={isActive && showFloatingTimer}
        activeTab={activeTab}
        onToggleTimer={toggleTimer}
        onResetTimer={resetTimer}
        onClose={closeFloatingTimer}
      />
      
      {/* Reminder Dialog */}
      <AlertDialog open={showReminder} onOpenChange={setShowReminder}>
        <AlertDialogContent className="sm:max-w-xs bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-800/50 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-lg">
              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mr-2">
              {reminderMessage.icon}
              </div>
              <span>Study Reminder</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-slate-700 dark:text-slate-300 mt-2">
              {reminderMessage.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm shadow-md shadow-indigo-500/20">
              Continue Studying
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudyTimer;
