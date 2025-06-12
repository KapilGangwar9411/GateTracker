import React, { useState, useEffect } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const VideoStudy: React.FC = () => {
  const { user } = useAuth();
  const [studyTime, setStudyTime] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [shouldSaveSession, setShouldSaveSession] = useState(false);

  // Handle video playback start
  const handleVideoStart = () => {
    if (!isStudying) {
      setIsStudying(true);
      setSessionStartTime(Date.now());
      setShouldSaveSession(false);
    }
  };

  // Handle video playback stop
  const handleVideoStop = () => {
    // Only update state, don't save the session
    if (isStudying) {
      setIsStudying(false);
    }
  };

  // Handle video completion
  const handleVideoComplete = async () => {
    if (isStudying && sessionStartTime) {
      setShouldSaveSession(true);
      setIsStudying(false);
    }
  };

  // Save study session
  const saveStudySession = async () => {
    if (!sessionStartTime) return;

    const duration = Math.floor((Date.now() - sessionStartTime) / 1000); // Convert to seconds
    
    try {
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user?.id,
          duration: duration,
          session_date: format(new Date(), 'yyyy-MM-dd')
        });

      if (error) throw error;

      toast.success('Study session saved', {
        description: `You studied for ${formatTime(duration)}`
      });
    } catch (error) {
      console.error('Error saving study session:', error);
      toast.error('Failed to save study session');
    }

    setSessionStartTime(null);
    setShouldSaveSession(false);
  };

  // Format time display (HH:MM:SS)
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update study time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStudying && sessionStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        setStudyTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isStudying, sessionStartTime]);

  // Save session when component unmounts if studying
  useEffect(() => {
    return () => {
      if (sessionStartTime) {
        saveStudySession();
      }
    };
  }, [sessionStartTime]);

  // Save session when shouldSaveSession is true
  useEffect(() => {
    if (shouldSaveSession) {
      saveStudySession();
    }
  }, [shouldSaveSession]);

  return (
    <div className="container mx-auto py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Study Session</h1>
        {isStudying && (
          <Card>
            <CardContent className="py-3">
              <span className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {formatTime(studyTime)}
              </span>
            </CardContent>
          </Card>
        )}
      </div>
      <VideoPlayer
        onPlay={handleVideoStart}
        onPause={handleVideoStop}
        onEnded={handleVideoComplete}
      />
    </div>
  );
};

export default VideoStudy; 