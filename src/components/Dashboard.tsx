import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, BrainCircuit, CheckCircle2, CircleOff, Clock, History, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Subject, Task, StudySession, Lecture } from '@/types/database.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const Dashboard = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

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

  const { data: lectureStats, isLoading: loadingLectures } = useQuery({
    queryKey: ['lectures-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select('completed');
      
      if (error) throw error;
      
      const total = data ? data.length : 0;
      const completed = data ? data.filter((lecture: {completed: boolean}) => lecture.completed).length : 0;
      
      return { total, completed };
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
    if (loadingSubjects || !subjectsStats) return 0;
    if (subjectsStats.totalTopics === 0) return 0;
    return Math.round((subjectsStats.completedTopics / subjectsStats.totalTopics) * 100);
  };

  const calculateLectureProgress = () => {
    if (loadingLectures || !lectureStats) return 0;
    if (lectureStats.total === 0) return 0;
    return Math.round((lectureStats.completed / lectureStats.total) * 100);
  };

  // Count completed tasks
  const completedTasksCount = todayTasks.filter((task: TaskWithSubject) => task.completed).length;

  // Check if study time is less than 3 hours
  const isLowStudyTime = studyHours && parseFloat(studyHours) < 3;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      
      {isLowStudyTime && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Low Study Time</AlertTitle>
          <AlertDescription className="text-xs">
            You've only studied for {studyHours} hours today. Aim for at least 3 hours of daily study for better results.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Subject Progress</CardTitle>
            <CardDescription>
              You've completed {loadingSubjects ? '...' : subjectsStats?.completedTopics} of {loadingSubjects ? '...' : subjectsStats?.totalTopics} topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lecture Progress</CardTitle>
            <CardDescription>
              You've completed {loadingLectures ? '...' : lectureStats?.completed} of {loadingLectures ? '...' : lectureStats?.total} lectures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{calculateLectureProgress()}%</span>
              </div>
              <Progress value={calculateLectureProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Tasks</p>
                <p className="text-2xl font-bold">
                  {completedTasksCount}/{todayTasks.length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Study</p>
                <p className="text-2xl font-bold">{loadingStudyHours ? '0.0' : studyHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Study Hours</p>
                <p className="text-2xl font-bold">{loadingTotalStudyHours ? '0.0' : totalStudyHours}h</p>
              </div>
              <History className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Topics Covered</p>
                <p className="text-2xl font-bold">{loadingSubjects ? '0' : subjectsStats?.completedTopics}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Practice Tests</p>
                <p className="text-2xl font-bold">{loadingPracticeTests ? '0' : practiceTests}</p>
              </div>
              <BrainCircuit className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Tasks</CardTitle>
          <CardDescription>Your scheduled tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingTasks ? (
              <div className="text-center py-4">Loading tasks...</div>
            ) : todayTasks.length > 0 ? (
              todayTasks.map((task: TaskWithSubject) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <CircleOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {task.time} ({task.duration}h)
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No tasks scheduled for today
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
