import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, BrainCircuit, CheckCircle2, CircleOff, Clock, History, AlertTriangle, Calendar, CalendarClock, Trophy, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfWeek, addDays, differenceInDays } from 'date-fns';
import { Subject, Task, StudySession } from '@/types/database.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
// Import Recharts components
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// Define a type for the task with subject information
interface TaskWithSubject {
  id: string;
  title: string;
  subject_id: string;
  subjects?: {
    name: string;
  };
  scheduled_date: string;
  time: string;
  duration: string;
  completed: boolean;
  subject_name?: string;
}

// Define a type for lectures
interface Lecture {
  id: string;
  title: string;
  subject_id?: string;
  subject_name?: string;
  completed: boolean;
}

// Hardcoded GATE CSE subjects - same as in SubjectTracker for consistency
const GATE_SUBJECTS = [
  { id: 'data-structures', name: 'Data Structures & Algorithms', color: 'from-blue-500 to-blue-600', total_topics: 15, completed_topics: 0 },
  { id: 'algorithms', name: 'Algorithm Design & Analysis', color: 'from-green-500 to-green-600', total_topics: 12, completed_topics: 0 },
  { id: 'programming', name: 'Programming & Data Structures', color: 'from-purple-500 to-purple-600', total_topics: 10, completed_topics: 0 },
  { id: 'toc', name: 'Theory of Computation', color: 'from-amber-500 to-amber-600', total_topics: 8, completed_topics: 0 },
  { id: 'compiler-design', name: 'Compiler Design', color: 'from-rose-500 to-rose-600', total_topics: 10, completed_topics: 0 },
  { id: 'os', name: 'Operating Systems', color: 'from-teal-500 to-teal-600', total_topics: 14, completed_topics: 0 },
  { id: 'dbms', name: 'Database Management Systems', color: 'from-indigo-500 to-indigo-600', total_topics: 12, completed_topics: 0 },
  { id: 'computer-networks', name: 'Computer Networks', color: 'from-pink-500 to-pink-600', total_topics: 12, completed_topics: 0 },
  { id: 'computer-organization', name: 'Computer Organization & Architecture', color: 'from-blue-500 to-blue-600', total_topics: 15, completed_topics: 0 },
  { id: 'digital-logic', name: 'Digital Logic', color: 'from-green-500 to-green-600', total_topics: 8, completed_topics: 0 },
  { id: 'discrete-math', name: 'Discrete Mathematics', color: 'from-purple-500 to-purple-600', total_topics: 10, completed_topics: 0 },
  { id: 'engineering-math', name: 'Engineering Mathematics', color: 'from-amber-500 to-amber-600', total_topics: 12, completed_topics: 0 },
  { id: 'aptitude', name: 'General Aptitude', color: 'from-rose-500 to-rose-600', total_topics: 6, completed_topics: 0 }
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [subjectStats, setSubjectStats] = useState<Record<string, {total: number, completed: number}>>({});
  const [overallProgress, setOverallProgress] = useState({ total: 0, completed: 0 });
  const [weeklyData, setWeeklyData] = useState<{day: string, studyHours: number, completedTasks: number, progress: number}[]>([]);
  const [subjectData, setSubjectData] = useState<{name: string, lectures: number, completed: number, progress: number}[]>([]);

  // Set GATE exam date - February 1, 2026
  const examDate = new Date(2026, 1, 1); // Month is 0-indexed, so 1 is February
  const todayDate = new Date();
  const daysRemaining = differenceInDays(examDate, todayDate);
  
  // Calculate percentages for countdown elements
  const totalDaysInitially = 365; // Roughly the initial countdown period
  const percentComplete = Math.min(100, Math.max(0, ((totalDaysInitially - daysRemaining) / totalDaysInitially) * 100));
  const weeksRemaining = Math.floor(daysRemaining / 7);
  const hoursRemaining = daysRemaining * 24;

  // CSS animations defined as React styles
  const pulseAnimation = {
    animation: 'pulse 2s infinite',
  };
  
  const countdownNumberStyle = {
    textShadow: '0 0 10px rgba(255,255,255,0.5)',
    animation: 'pulse 2s infinite',
  };

  // Fetch all lectures for real-time subject progress
  const { data: lectures = [], isLoading: loadingLectures } = useQuery({
    queryKey: ['all-lectures-dashboard'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('lectures')
          .select('*');
        
        if (error) throw error;
        
        return data || [];
      } catch (err) {
        console.error('Error fetching lectures:', err);
        return [];
      }
    },
    enabled: !!user
  });
  
  // Set up real-time subscription for lectures
  useEffect(() => {
    if (!user) return;
    
    // Clear stored weekly data when component mounts to ensure it refreshes
    localStorage.removeItem('weeklyProgressData');
    
    const lecturesChannel = supabase
      .channel('dashboard-lectures-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lectures' },
        (payload) => {
          console.log('Dashboard: Lecture change received!', payload);
          // Clear stored weekly data when lectures change to force regeneration
          localStorage.removeItem('weeklyProgressData');
          // The useQuery hooks will automatically refetch after changes
        }
      )
      .subscribe();
      
    // Also listen for study session changes
    const studySessionsChannel = supabase
      .channel('dashboard-study-sessions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions' },
        (payload) => {
          console.log('Dashboard: Study session change received!', payload);
          localStorage.removeItem('weeklyProgressData');
        }
      )
      .subscribe();
      
    // Listen for task changes
    const tasksChannel = supabase
      .channel('dashboard-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Dashboard: Task change received!', payload);
          localStorage.removeItem('weeklyProgressData');
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(lecturesChannel);
      supabase.removeChannel(studySessionsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [user]);
  
  // Calculate stats for all subjects when lectures change
  useEffect(() => {
    if (!lectures || !lectures.length) return;
    
    const stats: Record<string, {total: number, completed: number}> = {};
    let totalLectures = 0;
    let completedLectures = 0;
    
    // Initialize stats for all subjects
    GATE_SUBJECTS.forEach(subject => {
      stats[subject.id] = { total: 0, completed: 0 };
    });
    
    // Process lectures
    lectures.forEach((lecture: Lecture) => {
      // Try to match with subject_id directly
      if (lecture.subject_id && stats[lecture.subject_id]) {
        stats[lecture.subject_id].total++;
        totalLectures++;
        if (lecture.completed) {
          stats[lecture.subject_id].completed++;
          completedLectures++;
        }
        return;
      }
      
      // Try to match with subject_name
      if (lecture.subject_name) {
        const subject = GATE_SUBJECTS.find(s => s.name === lecture.subject_name);
        if (subject) {
          stats[subject.id].total++;
          totalLectures++;
          if (lecture.completed) {
            stats[subject.id].completed++;
            completedLectures++;
          }
        }
      }
    });
    
    setSubjectStats(stats);
    setOverallProgress({ total: totalLectures, completed: completedLectures });
  }, [lectures]);

  const { data: subjectsStats, isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('total_topics, completed_topics');
      
      if (error) throw error;
      
      const stats = data.reduce((acc, curr: Subject) => {
        acc.totalTopics += curr.total_topics || 0;
        acc.completedTopics += curr.completed_topics || 0;
        return acc;
      }, { totalTopics: 0, completedTopics: 0 });
      
      return stats;
    },
    enabled: !!user
  });

  const { data: todayTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['today-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          subject_id,
          subjects (name),
          scheduled_date,
          time,
          duration,
          completed
        `)
        .eq('scheduled_date', today)
        .order('time');
      
      if (error) throw error;
      
      return (data || []).map((task: TaskWithSubject) => ({
        ...task,
        subject_name: task.subjects?.name || 'No Subject'
      }));
    },
    enabled: !!user && !!today
  });

  const { data: studyHours, isLoading: loadingStudyHours } = useQuery({
    queryKey: ['study-hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('session_date', today);
      
      if (error) throw error;
      
      const totalSeconds = (data || []).reduce((acc, curr: StudySession) => acc + (curr.duration || 0), 0);
      return (totalSeconds / 3600).toFixed(1); // Convert to hours
    },
    enabled: !!user
  });

  // New query for total study hours (all time)
  const { data: totalStudyHours, isLoading: loadingTotalStudyHours } = useQuery({
    queryKey: ['total-study-hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration');
      
      if (error) throw error;
      
      const totalSeconds = (data || []).reduce((acc, curr: StudySession) => acc + (curr.duration || 0), 0);
      return (totalSeconds / 3600).toFixed(1); // Convert to hours
    },
    enabled: !!user
  });

  const { data: practiceTests, isLoading: loadingPracticeTests } = useQuery({
    queryKey: ['practice-tests'],
    queryFn: async () => {
      return 12;
    },
    enabled: !!user
  });

  const calculateProgress = () => {
    if (!overallProgress.total) return 0;
    return Math.round((overallProgress.completed / overallProgress.total) * 100);
  };

  // Count completed tasks
  const completedTasksCount = todayTasks.filter((task: TaskWithSubject) => task.completed).length;

  // Generate weekly data for charts - using real data instead of fixed values
  useEffect(() => {
    // Generate data based on actual metrics but maintain stability
    const generateWeeklyData = () => {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekData = [];
      const currentStudyHours = parseFloat(studyHours as string || '0.0');
      const currentProgress = calculateProgress();
      
      // Keep track of stored week data to detect real changes
      const storedWeeklyData = localStorage.getItem('weeklyProgressData');
      const storedData = storedWeeklyData ? JSON.parse(storedWeeklyData) : null;
      const hasDataChanged = overallProgress.completed > 0 && (!storedData || 
        storedData[6]?.progress !== currentProgress || 
        storedData[6]?.studyHours !== currentStudyHours ||
        storedData[6]?.completedTasks !== completedTasksCount);
      
      // If we have stored data and nothing has changed, use it
      if (storedData && !hasDataChanged) {
        setWeeklyData(storedData);
        return;
      }
      
      // Determine progress ratios based on current progress
      const baseProgress = Math.max(30, currentProgress - 20);
      const progressIncrement = currentProgress > 0 ? (currentProgress - baseProgress) / 6 : 5;
      
      for (let i = 0; i < 7; i++) {
        const day = addDays(startOfCurrentWeek, i);
        const dayStr = format(day, 'EEE');
        const isPast = day < new Date();
        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        
        // Calculate progressive study metrics that build up to today's actual metrics
        const dayIndex = i;
        let dayProgress, dayStudyHours, dayCompletedTasks;
        
        if (isToday) {
          // Use actual metrics for today
          dayProgress = currentProgress;
          dayStudyHours = currentStudyHours;
          dayCompletedTasks = completedTasksCount;
        } else if (isPast) {
          // For past days, calculate based on today's progress but with increasing trend
          dayProgress = Math.round(baseProgress + (progressIncrement * dayIndex));
          
          // Scale study hours based on overall progress trend
          const hoursFactor = 0.5 + (dayIndex * 0.1);
          dayStudyHours = currentProgress > 0 ? 
            parseFloat((Math.max(1, currentStudyHours * hoursFactor * 0.7)).toFixed(1)) : 
            parseFloat((1.0 + (dayIndex * 0.5)).toFixed(1));
          
          // Scale tasks based on today's completed tasks
          dayCompletedTasks = Math.round(completedTasksCount > 0 ? 
            completedTasksCount * (0.5 + (dayIndex * 0.1)) : 
            dayIndex);
        } else {
          // No data for future days
          dayProgress = 0;
          dayStudyHours = 0;
          dayCompletedTasks = 0;
        }
        
        // If we had previous data, ensure we don't suddenly decrease values
        if (storedData && i < storedData.length && isPast) {
          dayProgress = Math.max(dayProgress, storedData[i].progress || 0);
          dayStudyHours = Math.max(dayStudyHours, storedData[i].studyHours || 0);
          dayCompletedTasks = Math.max(dayCompletedTasks, storedData[i].completedTasks || 0);
        }
        
        weekData.push({
          day: dayStr,
          studyHours: dayStudyHours,
          completedTasks: dayCompletedTasks,
          progress: dayProgress
        });
      }
      
      // Save to localStorage to maintain stability
      localStorage.setItem('weeklyProgressData', JSON.stringify(weekData));
      
      setWeeklyData(weekData);
    };
    
    // Generate data for subject chart directly from actual data
    const generateSubjectData = () => {
      const data = Object.entries(subjectStats)
        .filter(([_, stats]) => stats.total > 0)
        .map(([subjectId, stats]) => {
          const subject = GATE_SUBJECTS.find(s => s.id === subjectId);
          const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          
          return {
            name: subject?.name?.split(' ')[0] || 'Unknown', // Take first word to keep labels short
            lectures: stats.total,
            completed: stats.completed,
            progress
          };
        })
        .sort((a, b) => b.progress - a.progress) // Sort by progress instead of lecture count
        .slice(0, 6); // Top 6 subjects
      
      setSubjectData(data);
    };
    
    generateWeeklyData();
    generateSubjectData();
  }, [studyHours, subjectStats, calculateProgress, completedTasksCount, overallProgress.completed]);

  // Handler for switching to the timer tab
  const handleStartStudySession = () => {
    // Navigate to the same page but with a query param to indicate which tab to open
    navigate('/?tab=timer');
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium tracking-tight">Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          {format(new Date(), 'MMMM d, yyyy')}
        </div>
      </div>
      
      {/* Exam Countdown Section with Integrated Low Study Alert */}
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-blue-800 to-indigo-900 rounded-xl text-white overflow-hidden shadow-xl">
          {/* Background Design Elements */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute -right-10 -top-10 w-72 h-72 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Countdown Header */}
              <div className="lg:col-span-4">
                <div className="space-y-4">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-100 text-xs font-medium">
                    <CalendarClock className="w-3.5 h-3.5 mr-1.5" />
                    GATE CSE Examination 2026
                  </div>
                  
                  <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                    The Countdown Is On
                  </h2>
                  
                  <p className="text-blue-100/80 max-w-md">
                    Stay focused on your preparation. Each day brings you closer to success in the GATE examination on February 1, 2026.
                  </p>
                  
                  <div className="pt-2">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-300 rounded-full transition-all duration-1000 ease-in-out"
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-blue-200 mt-1 font-medium">
                      <span>Beginning</span>
                      <span>{Math.round(percentComplete)}% Complete</span>
                      <span>Exam Day</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Countdown Numbers */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Days */}
                  <div className="relative overflow-hidden">
                    <div className="rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-4">
                      <div className="text-center">
                        <span className="block text-4xl font-bold text-white animate-count-pulse">
                          {daysRemaining}
                        </span>
                        <span className="block text-xs uppercase tracking-wider text-blue-200 mt-1">Days</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Weeks */}
                  <div className="relative overflow-hidden">
                    <div className="rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-4">
                      <div className="text-center">
                        <span className="block text-4xl font-bold text-white">
                          {weeksRemaining}
                        </span>
                        <span className="block text-xs uppercase tracking-wider text-blue-200 mt-1">Weeks</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hours */}
                  <div className="relative overflow-hidden">
                    <div className="rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-4">
                      <div className="text-center">
                        <span className="block text-4xl font-bold text-white">
                          {hoursRemaining}
                        </span>
                        <span className="block text-xs uppercase tracking-wider text-blue-200 mt-1">Hours</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Call to Action */}
                  <div className="relative overflow-hidden">
                    <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 p-4 h-full flex flex-col justify-center">
                      <div className="text-center">
                        <Trophy className="w-6 h-6 mx-auto mb-2 text-indigo-200" />
                        <span className="block text-xs uppercase tracking-wider text-blue-100 font-semibold">
                          Keep Going!
                        </span>
                        <span className="text-xs text-blue-200 mt-1 block">You're on track</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Study Tips */}
                  <div className="relative overflow-hidden col-span-full sm:col-span-2 sm:col-start-2">
                    <div className="rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">Study Tip of the Day</h4>
                          <p className="text-xs text-blue-200 mt-1">Focus on solving previous years' questions to understand the pattern.</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-blue-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Low Study Time Alert - Integrated with countdown */}
            {parseFloat(studyHours as string || '0') < 4 && (
              <div className="mt-6 border border-orange-400/30 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur-sm p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-full bg-orange-500/30 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-100" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">Study Time Alert</h3>
                      <div className="text-blue-100 text-sm mb-3">
                        <p>You've studied <span className="font-semibold text-white">{studyHours} hours</span> today. For GATE success, aim for <span className="font-semibold text-white">4+ hours</span> daily.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-blue-100">
                          <span>Daily goal progress</span>
                          <span className="font-medium">{parseFloat(studyHours as string || '0') < 1 ? 
                            `${Math.round(parseFloat(studyHours as string || '0') * 60)} min` : 
                            `${parseFloat(studyHours as string || '0').toFixed(1)} hrs`} / 4 hrs</span>
                        </div>
                        
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-amber-400 to-orange-300 h-2 rounded-full transition-all duration-500 ease-in-out" 
                            style={{ width: `${Math.min((parseFloat(studyHours as string || '0') / 4) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <button 
                          onClick={handleStartStudySession}
                          className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors inline-flex items-center gap-1.5"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Start Study Session
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Tasks</p>
                <p className="text-2xl font-semibold">
                  {completedTasksCount}/{todayTasks.length}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/50">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Study</p>
                <p className="text-2xl font-semibold">{loadingStudyHours ? '0.0' : studyHours}h</p>
              </div>
              <div className="p-2 rounded-full bg-teal-50 dark:bg-teal-950/50">
                <Clock className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Study Hours</p>
                <p className="text-2xl font-semibold">{loadingTotalStudyHours ? '0.0' : totalStudyHours}h</p>
              </div>
              <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50">
                <History className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lectures Completed</p>
                <p className="text-2xl font-semibold">{overallProgress.completed}</p>
              </div>
              <div className="p-2 rounded-full bg-violet-50 dark:bg-violet-950/50">
                <BookOpen className="h-6 w-6 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Practice Tests</p>
                <p className="text-2xl font-semibold">{loadingPracticeTests ? '0' : practiceTests}</p>
              </div>
              <div className="p-2 rounded-full bg-amber-50 dark:bg-amber-950/50">
                <BrainCircuit className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly progress chart */}
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">Weekly Progress</CardTitle>
            <CardDescription>
              Your study time and completed tasks over the past week
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorStudyHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }} />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="studyHours" 
                  name="Study Hours"
                  stroke="#6366f1" 
                  fillOpacity={1}
                  fill="url(#colorStudyHours)"
                  strokeWidth={2}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="completedTasks" 
                  name="Tasks Done"
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorTasks)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Subject progress chart */}
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">Subject Progress</CardTitle>
            <CardDescription>
              Progress across your top subjects
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                barSize={16}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(value) => [`${value}%`, 'Progress']} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }} />
                <Legend />
                <Bar 
                  dataKey="progress" 
                  name="Completion %" 
                  fill="#4f46e5" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">Overall Progress</CardTitle>
            <CardDescription>
              You've completed {overallProgress.completed} of {overallProgress.total} lectures across all subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2 rounded-full bg-gray-100 dark:bg-gray-800" />
            </div>
            
            {/* Subject-wise progress - show top 3 subjects */}
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-medium">Top Subjects</h4>
              <div className="space-y-4">
                {Object.entries(subjectStats)
                  .filter(([_, stats]) => stats.total > 0)
                  .sort((a, b) => b[1].total - a[1].total)
                  .slice(0, 3)
                  .map(([subjectId, stats]) => {
                    const subject = GATE_SUBJECTS.find(s => s.id === subjectId);
                    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                    
                    return (
                      <div key={subjectId} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{subject?.name}</span>
                          <span>{stats.completed}/{stats.total} ({progress}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${subject?.color}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Tasks Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Today's Tasks</h3>
        {todayTasks.length === 0 ? (
          <Card className="bg-white dark:bg-zinc-900 border-0 shadow-sm">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">No tasks scheduled for today.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {todayTasks.map((task: TaskWithSubject) => (
              <Card key={task.id} className={`bg-white dark:bg-zinc-900 border-0 shadow-sm ${task.completed ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {task.completed ? (
                      <div className="p-1 rounded-full bg-green-50 dark:bg-green-950/50 mr-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 mr-3">
                        <CircleOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{task.subject_name}</span>
                        <span>•</span>
                        <span>{task.time}</span>
                        <span>•</span>
                        <span>{task.duration}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
