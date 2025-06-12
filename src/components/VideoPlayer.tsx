import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
  FolderOpen,
  FastForward
} from 'lucide-react';

interface VideoPlayerProps {
  onTimeUpdate?: (time: number) => void;
  isStudySessionActive?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  onTimeUpdate,
  isStudySessionActive = false,
  onPlay,
  onPause,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const videoUrl = URL.createObjectURL(file);
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
      }
    }
  };

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        onPause?.();
      } else {
        videoRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, onPause, onPlay]);

  // Volume control
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted) {
        videoRef.current.volume = volume;
      }
    }
  };

  // Seek control
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Playback speed control
  const handleSpeedChange = () => {
    if (videoRef.current) {
      const speeds = [1, 1.5, 2, 2.5, 3];
      const currentIndex = speeds.indexOf(playbackSpeed);
      const nextIndex = (currentIndex + 1) % speeds.length;
      const newSpeed = speeds[nextIndex];
      
      videoRef.current.playbackRate = newSpeed;
      setPlaybackSpeed(newSpeed);
    }
  };

  // Update time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isStudySessionActive && onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isStudySessionActive, onTimeUpdate, onEnded]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle keyboard events if we have a video loaded
      if (!selectedFile) return;

      // Prevent default space bar behavior (page scroll)
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedFile, togglePlay]); // Added togglePlay as dependency

  // Format time (seconds to MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Video Lecture Player</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              (Space to play/pause)
            </span>
          </div>
          <Button variant="outline" onClick={() => document.getElementById('video-file')?.click()}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Open Video
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            onClick={togglePlay}
          />
          {!selectedFile && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <p>Select a video file to begin</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Progress bar */}
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />

          {/* Time display */}
          <div className="flex justify-between text-sm text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-10)}
                disabled={!selectedFile}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                disabled={!selectedFile}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(10)}
                disabled={!selectedFile}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeedChange}
                disabled={!selectedFile}
                className="flex items-center gap-1"
              >
                <FastForward className="h-4 w-4" />
                <span className="text-xs font-mono">{playbackSpeed}x</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                disabled={!selectedFile}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  disabled={!selectedFile}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                disabled={!selectedFile}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <Input
          id="video-file"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
};

export default VideoPlayer; 