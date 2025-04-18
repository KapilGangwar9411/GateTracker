import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, RotateCcw, Bell, Droplets, Coffee, Calendar, BarChart, X, Move } from 'lucide-react';
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
      className={`fixed z-50 bg-card border rounded-lg shadow-md p-2 w-32 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      <div className="text-center mb-2">
        <div className="text-xl font-bold">{formatTime(time)}</div>
      </div>
      
      <div className="flex justify-center space-x-1">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-7 w-7 rounded-full hover:bg-muted transition-colors"
          onClick={onToggleTimer}
        >
          {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-muted transition-colors"
          onClick={onResetTimer}
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
      
      // Generate a session ID if one doesn't exist yet
      const sessionId = currentSessionId || `${user.id}_${Date.now()}`;
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }
      
      // Check if this session has already been saved
      if (isSessionSaved(sessionId)) {
        console.log('Session already saved, preventing duplicate save');
        return;
      }
      
      // Mark the session as saved BEFORE database operation to prevent race conditions
      markSessionSaved(sessionId);
      
      console.log(`Saving session ${sessionId} with duration ${duration} seconds`);
      
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          duration: duration,
          session_date: format(new Date(), 'yyyy-MM-dd')
        });
      
      if (error) {
        // Remove from saved sessions if there was an error
        removeSessionSaved(sessionId);
        
        toast.error('Error saving study session', { description: error.message });
        throw error;
      } else {
        toast.success('Study session saved', { description: `You studied for ${formatStudyTimeForDisplay(duration)}` });
        refetchSessions();
        refetchHistorical();
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
      
      if (activeTab === "pomodoro" && sessionStartTime !== null && !sessionSaved) {
        // Calculate the actual study duration in minutes
        const sessionDuration = parseInt(selectedTime) * 60;
        
        // Set saved flag first to prevent any race conditions
        setSessionSaved(true);
        
        // Generate a unique ID for this completed session if not already set
        if (!currentSessionId) {
          setCurrentSessionId(`${user?.id || 'anon'}_${sessionStartTime}`);
        }
        
        // Check if already saved
        const sessionId = currentSessionId || `${user?.id || 'anon'}_${sessionStartTime}`;
        if (!isSessionSaved(sessionId)) {
          saveSession.mutate(sessionDuration);
        } else {
          console.log(`Session ${sessionId} already saved, skipping save`);
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
        setCycles(prev => prev + 1);
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
  }, [isActive, time, activeTab, selectedTime, sessionStartTime, saveSession, reminderInterval, nextReminderTime, sessionSaved, currentSessionId, user]);

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

  return (
    <div className="space-y-2 max-w-sm mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Study Timer
        </h2>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 hover:bg-muted transition-colors"
            onClick={toggleFloatingTimer}
            disabled={!isActive}
          >
            <Move className="h-3 w-3 mr-1" />
            <span className="text-xs">Float</span>
          </Button>
          <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 hover:bg-muted transition-colors">
                <BarChart className="h-3 w-3 mr-1" />
                <span className="text-xs">Stats</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">Study Statistics</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-3 gap-1">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Today's Study</p>
                    <p className="text-sm font-semibold">{formatStudyTimeForDisplay(totalStudyTime)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Sessions</p>
                    <p className="text-sm font-semibold">{todaySessions?.length || 0}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Cycles</p>
                    <p className="text-sm font-semibold">{cycles}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-medium">Historical Study Time</h4>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="180">Last 180 days</SelectItem>
                        <SelectItem value="365">Last year</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {dateRange === "custom" && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex-1">
                        <label className="block text-muted-foreground mb-1">Start Date</label>
                        <Input 
                          type="date" 
                          className="h-7 text-xs"
                          value={customDateRange.start ? format(customDateRange.start, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            setCustomDateRange(prev => ({ ...prev, start: date }));
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-muted-foreground mb-1">End Date</label>
                        <Input 
                          type="date" 
                          className="h-7 text-xs"
                          value={customDateRange.end ? format(customDateRange.end, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : null;
                            setCustomDateRange(prev => ({ ...prev, end: date }));
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-muted-foreground">Total Study Time</p>
                      <p className="font-medium">{formatStudyTimeForDisplay(totalHistoricalStudyTime)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-muted-foreground">Average Per Day</p>
                      <p className="font-medium">{formatStudyTimeForDisplay(averageStudyTimePerDay)}</p>
                    </div>
                  </div>
                  
                  <div className="h-40 overflow-y-auto space-y-1">
                    {historicalData.length > 0 ? (
                      historicalData.map((day) => (
                        <div 
                          key={day.date} 
                          className="flex justify-between items-center text-xs p-1.5 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => setSelectedDate(new Date(day.date))}
                        >
                          <span className="font-medium">
                            {format(new Date(day.date), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-primary font-medium">
                            {formatStudyTimeForDisplay(day.duration)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No study data available for the selected period
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-medium">Today's Sessions</h4>
                  {todaySessions && todaySessions.length > 0 ? (
                    <div className="space-y-0.5 max-h-32 overflow-y-auto">
                      {todaySessions.map((session, index) => (
                        <div key={session.id} className="flex justify-between items-center text-xs p-1 rounded-lg hover:bg-muted">
                          <span className="font-medium">Session {index + 1}</span>
                          <span className="text-primary">{formatStudyTimeForDisplay(session.duration)}</span>
                          <span className="text-muted-foreground">
                            {new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No study sessions recorded today</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card className="border shadow-sm bg-card">
        <CardHeader className="pb-0 pt-3 px-3">
          <CardTitle className="text-base text-center">Pomodoro Timer</CardTitle>
          <CardDescription className="text-center text-xs">Focus with timed study sessions</CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="pomodoro" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs py-1">
                Study
              </TabsTrigger>
              <TabsTrigger value="break" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground text-xs py-1">
                Break
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pomodoro" className="space-y-2">
              <div className="w-full flex justify-center gap-1">
                <Select value={selectedTime} onValueChange={handleTimeChange} disabled={isActive}>
                  <SelectTrigger className="w-28 bg-background text-xs h-8">
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
              
              <div className="flex items-center gap-1 justify-center">
                <span className="text-xs text-muted-foreground">Reminder:</span>
                <Select value={reminderInterval} onValueChange={setReminderInterval} disabled={isActive}>
                  <SelectTrigger className="w-20 bg-background text-xs h-8">
                    <SelectValue placeholder="Interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="break">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-xs">
                Take a short break to recharge!
              </p>
                <div className="grid grid-cols-2 gap-1 max-w-[200px] mx-auto">
                  <div className="p-1 rounded-lg bg-card shadow-sm">
                    <Droplets className="h-4 w-4 mx-auto mb-0.5 text-primary" />
                    <p className="text-[10px]">Stay hydrated</p>
                  </div>
                  <div className="p-1 rounded-lg bg-card shadow-sm">
                    <Coffee className="h-4 w-4 mx-auto mb-0.5 text-amber-500" />
                    <p className="text-[10px]">Rest your eyes</p>
                  </div>
                  <div className="p-1 rounded-lg bg-card shadow-sm">
                    <Bell className="h-4 w-4 mx-auto mb-0.5 text-primary/80" />
                    <p className="text-[10px]">Stretch</p>
                  </div>
                  <div className="p-1 rounded-lg bg-card shadow-sm">
                    <Calendar className="h-4 w-4 mx-auto mb-0.5 text-primary/60" />
                    <p className="text-[10px]">Plan ahead</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <div className="text-center my-2">
              <div className="relative w-28 h-28 mx-auto mb-2">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-primary"
                    strokeWidth="8"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * (1 - time / (parseInt(selectedTime) * 60)))}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="text-2xl font-bold">{formatTime(time)}</div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-full hover:bg-muted transition-colors"
                  onClick={toggleTimer}
                  disabled={saveSession.isPending}
                >
                  {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-full hover:bg-muted transition-colors"
                  onClick={resetTimer}
                  disabled={saveSession.isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-center space-y-0.5">
              <div className="text-xs text-muted-foreground">
              Completed cycles: {cycles}
              </div>
              {totalStudyTime > 0 && (
                <div className="text-xs font-medium text-primary">
                  Today's study time: {formatStudyTimeForDisplay(totalStudyTime)}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center border-t bg-muted/30 py-1">
          <div className="text-[10px] text-center text-muted-foreground max-w-xs">
            Set a timer, stay focused, and take regular breaks.
          </div>
        </CardFooter>
      </Card>
      
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
        <AlertDialogContent className="sm:max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-base">
              {reminderMessage.icon}
              Study Reminder
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {reminderMessage.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-primary hover:bg-primary/90 text-xs py-1">
              Continue Studying
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudyTimer;
