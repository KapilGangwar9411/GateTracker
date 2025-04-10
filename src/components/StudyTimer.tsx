import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, RotateCcw, Bell, Droplets, Coffee, Calendar, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const REMINDER_MESSAGES = [
  { icon: <Droplets className="h-6 w-6 mr-2" />, message: "Time to hydrate! Drink some water." },
  { icon: <Coffee className="h-6 w-6 mr-2" />, message: "Take a short break to rest your eyes." },
  { icon: <Bell className="h-6 w-6 mr-2" />, message: "Stand up and stretch for a minute." }
] as const;

type ReminderMessage = typeof REMINDER_MESSAGES[number];

// Web Audio API sound generator
const playSound = (type: 'reminder' | 'completion') => {
  try {
    // Define AudioContext for TypeScript
    type AudioContextType = typeof window.AudioContext;
    const AudioContext = window.AudioContext || 
      (typeof window !== 'undefined' ? 
        ((window as unknown).webkitAudioContext as AudioContextType) : 
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

const StudyTimer = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pomodoro");
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(1500); // 25 minutes in seconds
  const [selectedTime, setSelectedTime] = useState("25");
  const [reminderInterval, setReminderInterval] = useState("15"); // Reminder interval in minutes
  const [cycles, setCycles] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<ReminderMessage>(REMINDER_MESSAGES[0]);
  const [nextReminderTime, setNextReminderTime] = useState<number | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  
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

  // Calculate today's total study time
  useEffect(() => {
    if (todaySessions) {
      const total = todaySessions.reduce((sum, session) => sum + session.duration, 0);
      setTotalStudyTime(total);
    }
  }, [todaySessions]);

  // Save a study session
  const saveSession = useMutation({
    mutationFn: async (duration: number) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert([
          {
            user_id: user?.id,
            duration, // in seconds
            session_date: new Date().toISOString().split('T')[0], // Store the date
          }
        ])
        .select();
      
      if (error) {
        toast.error('Error saving session', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, duration) => {
      refetchSessions();
      toast.success('Study session saved', { 
        description: `You studied for ${Math.floor(duration / 60)} minutes` 
      });
    }
  });

  // Timer logic
  useEffect(() => {
    let interval: number | undefined;
    
    if (isActive && time > 0) {
      interval = window.setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      // Timer finished
      setIsActive(false);
      
      if (activeTab === "pomodoro" && sessionStartTime !== null) {
        const sessionDuration = parseInt(selectedTime) * 60 - time;
        saveSession.mutate(sessionDuration);
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
      if (interval) clearInterval(interval);
    };
  }, [isActive, time, activeTab, selectedTime, sessionStartTime, saveSession, reminderInterval, nextReminderTime]);

  const toggleTimer = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    
    // If starting a pomodoro timer, record the start time
    if (newIsActive && activeTab === "pomodoro" && !sessionStartTime) {
      setSessionStartTime(Date.now());
      
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
    }
    
    // If stopping a pomodoro timer, save the session
    if (!newIsActive && activeTab === "pomodoro" && sessionStartTime !== null) {
      const sessionDuration = parseInt(selectedTime) * 60 - time;
      saveSession.mutate(sessionDuration);
      setSessionStartTime(null);
      setNextReminderTime(null);
    }
  };
  
  const resetTimer = () => {
    // If resetting an active pomodoro timer, save the session
    if (isActive && activeTab === "pomodoro" && sessionStartTime !== null) {
      const sessionDuration = parseInt(selectedTime) * 60 - time;
      if (sessionDuration > 10) { // Only save if at least 10 seconds elapsed
        saveSession.mutate(sessionDuration);
      }
    }
    
    setIsActive(false);
    setSessionStartTime(null);
    setNextReminderTime(null);
    
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
    // If changing from an active pomodoro timer, save the session
    if (activeTab === "pomodoro" && isActive && sessionStartTime !== null) {
      const sessionDuration = parseInt(selectedTime) * 60 - time;
      if (sessionDuration > 10) { // Only save if at least 10 seconds elapsed
        saveSession.mutate(sessionDuration);
      }
    }
    
    setActiveTab(value);
    setIsActive(false);
    setSessionStartTime(null);
    setNextReminderTime(null);
    
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Study Timer</h2>
        <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
              <BarChart className="h-4 w-4 mr-2" />
              Today's Stats
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Study Statistics</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Today's study time:</span>
                  <span className="font-medium">{formatStudyTimeForDisplay(totalStudyTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sessions completed:</span>
                  <span className="font-medium">{todaySessions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pomodoro cycles:</span>
                  <span className="font-medium">{cycles}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Today's sessions</h4>
                {todaySessions && todaySessions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {todaySessions.map((session, index) => (
                      <div key={session.id} className="flex justify-between text-sm border-b pb-1">
                        <span>Session {index + 1}</span>
                        <span>{formatStudyTimeForDisplay(session.duration)}</span>
                        <span className="text-muted-foreground">
                          {new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No study sessions recorded today</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg text-center">Pomodoro Timer</CardTitle>
          <CardDescription className="text-center">Focus with timed study sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pomodoro">Study</TabsTrigger>
              <TabsTrigger value="break">Break</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pomodoro" className="space-y-4">
              <div className="w-full flex justify-center gap-2">
                <Select value={selectedTime} onValueChange={handleTimeChange} disabled={isActive}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Study Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 justify-center mt-4">
                <span className="text-sm">Reminder every:</span>
                <Select value={reminderInterval} onValueChange={setReminderInterval} disabled={isActive}>
                  <SelectTrigger className="w-28">
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
              <p className="text-center text-muted-foreground mb-4">
                Take a short break to recharge!
              </p>
              <div className="space-y-2">
                <p className="text-sm">Suggestions:</p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center">• Stand up and stretch</li>
                  <li className="flex items-center">• Drink a glass of water</li>
                  <li className="flex items-center">• Look away from screen</li>
                  <li className="flex items-center">• Take a few deep breaths</li>
                </ul>
              </div>
            </TabsContent>
            
            <div className="text-center my-8">
              <div className="mb-2">
                <Progress value={(1 - time / (parseInt(selectedTime) * 60)) * 100} className="h-2" />
              </div>
              
              <div className="text-6xl font-semibold mb-6">{formatTime(time)}</div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12"
                  onClick={toggleTimer}
                  disabled={saveSession.isPending}
                >
                  {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-12 w-12"
                  onClick={resetTimer}
                  disabled={saveSession.isPending}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-sm text-muted-foreground">
                Completed cycles: {cycles}
              </div>
              {totalStudyTime > 0 && (
                <div className="text-sm">
                  Today's study time: {formatStudyTimeForDisplay(totalStudyTime)}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-xs text-center text-muted-foreground max-w-xs">
            Set a timer, stay focused, and take regular breaks. Your study time is automatically tracked.
          </div>
        </CardFooter>
      </Card>
      
      {/* Reminder Dialog */}
      <AlertDialog open={showReminder} onOpenChange={setShowReminder}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {reminderMessage.icon}
              Study Reminder
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {reminderMessage.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Continue Studying</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudyTimer;
