
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const StudyTimer = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pomodoro");
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(1500); // 25 minutes in seconds
  const [selectedTime, setSelectedTime] = useState("25");
  const [cycles, setCycles] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);

  // Save a study session
  const saveSession = useMutation({
    mutationFn: async (duration: number) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert([
          {
            user_id: user?.id,
            duration, // in seconds
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
      setTotalStudyTime(prev => prev + duration);
      toast.success('Study session saved', { 
        description: `You studied for ${Math.floor(duration / 60)} minutes` 
      });
    }
  });

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
      }
      
      if (activeTab === "pomodoro") {
        // Switch to break
        setCycles(prev => prev + 1);
        setActiveTab("break");
        setTime(300); // 5 min break
      } else {
        // Switch back to pomodoro
        setActiveTab("pomodoro");
        setTime(parseInt(selectedTime) * 60);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time, activeTab, selectedTime, sessionStartTime, saveSession]);

  const toggleTimer = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    
    // If starting a pomodoro timer, record the start time
    if (newIsActive && activeTab === "pomodoro" && !sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    
    // If stopping a pomodoro timer, save the session
    if (!newIsActive && activeTab === "pomodoro" && sessionStartTime !== null) {
      const sessionDuration = parseInt(selectedTime) * 60 - time;
      saveSession.mutate(sessionDuration);
      setSessionStartTime(null);
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
    
    if (value === "pomodoro") {
      setTime(parseInt(selectedTime) * 60);
    } else {
      setTime(300); // 5 min break
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Study Timer</h2>
      
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
              <div className="w-full flex justify-center">
                <Select value={selectedTime} onValueChange={handleTimeChange} disabled={isActive}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Study Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="break">
              <p className="text-center text-muted-foreground">
                Take a short break to recharge!
              </p>
            </TabsContent>
            
            <div className="text-center my-8">
              <div className="text-6xl font-semibold mb-6">{formatTime(time)}</div>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleTimer}
                  disabled={saveSession.isPending}
                >
                  {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={resetTimer}
                  disabled={saveSession.isPending}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Completed cycles: {cycles}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyTimer;
