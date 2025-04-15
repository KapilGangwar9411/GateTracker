import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check, Calendar, Clock, BookOpen, Bookmark, Plus, Edit, Search, Filter, X, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

// GATE CSE subjects info - same as in SubjectTracker for consistency
const GATE_SUBJECTS = {
  'data-structures': { name: 'Data Structures & Algorithms', color: 'from-blue-500 to-blue-600' },
  'algorithms': { name: 'Algorithm Design & Analysis', color: 'from-green-500 to-green-600' },
  'programming': { name: 'Programming & Data Structures', color: 'from-purple-500 to-purple-600' },
  'toc': { name: 'Theory of Computation', color: 'from-amber-500 to-amber-600' },
  'compiler-design': { name: 'Compiler Design', color: 'from-rose-500 to-rose-600' },
  'os': { name: 'Operating Systems', color: 'from-teal-500 to-teal-600' },
  'dbms': { name: 'Database Management Systems', color: 'from-indigo-500 to-indigo-600' },
  'computer-networks': { name: 'Computer Networks', color: 'from-pink-500 to-pink-600' },
  'computer-organization': { name: 'Computer Organization & Architecture', color: 'from-blue-500 to-blue-600' },
  'digital-logic': { name: 'Digital Logic', color: 'from-green-500 to-green-600' },
  'discrete-math': { name: 'Discrete Mathematics', color: 'from-purple-500 to-purple-600' },
  'engineering-math': { name: 'Engineering Mathematics', color: 'from-amber-500 to-amber-600' },
  'aptitude': { name: 'General Aptitude', color: 'from-rose-500 to-rose-600' }
};

// Define interface for database lectures
interface DBLecture {
  id: string;
  title: string;
  description?: string;
  subject_id: string;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  enable_notification?: boolean;
}

// Define interface for our UI with additional fields
interface Lecture extends DBLecture {
  revised: boolean;
  importance: 'high' | 'medium' | 'low';
}

interface NewLecture {
  title: string;
  description: string;
  subject_id: string;
  importance: 'high' | 'medium' | 'low';
}

// Helper function to check for and trigger notifications
const checkAndTriggerNotifications = () => {
  // Get all keys from localStorage that might contain lecture schedules
  const scheduleKeys = Object.keys(localStorage).filter(key => key.startsWith('lecture_schedule_'));
  
  // Get current date and time
  const now = new Date();
  const currentDateString = format(now, 'yyyy-MM-dd');
  const currentTimeString = format(now, 'HH:mm');
  
  // Check each scheduled lecture
  scheduleKeys.forEach(key => {
    try {
      // Extract lecture ID from key
      const lectureId = key.replace('lecture_schedule_', '');
      
      // Check if notifications are enabled for this lecture
      const notificationKey = `lecture_notification_${lectureId}`;
      const notificationsEnabled = localStorage.getItem(notificationKey) === 'true';
      
      if (!notificationsEnabled) return;
      
      // Get schedule info
      const scheduleInfo = localStorage.getItem(key);
      if (!scheduleInfo) return;
      
      const schedule = JSON.parse(scheduleInfo);
      const { date, time } = schedule;
      
      // If the scheduled date and time match current date and time (within 5 minutes)
      if (date === currentDateString) {
        const scheduledTime = new Date(`${date}T${time}`);
        const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime()) / 60000; // difference in minutes
        
        // If within 5 minutes of scheduled time
        if (timeDiff <= 5) {
          // Fetch lecture title from database or localStorage cache
          const cachedLectureKey = `lecture_data_${lectureId}`;
          const cachedLecture = localStorage.getItem(cachedLectureKey);
          let lectureTitle = "Your scheduled lecture";
          
          if (cachedLecture) {
            try {
              const lecture = JSON.parse(cachedLecture);
              lectureTitle = lecture.title;
            } catch (e) {
              console.error('Error parsing cached lecture data', e);
            }
          }
          
          // Show notification
          if (Notification.permission === 'granted') {
            new Notification('Lecture Reminder', {
              body: `${lectureTitle} is starting now!`,
              icon: '/favicon.ico'
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('Lecture Reminder', {
                  body: `${lectureTitle} is starting now!`,
                  icon: '/favicon.ico'
                });
              }
            });
          }
          
          // Mark as notified to prevent duplicate notifications
          localStorage.setItem(`${key}_notified`, 'true');
        }
      }
    } catch (e) {
      console.error('Error checking notifications', e);
    }
  });
};

const SubjectLectures = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // States for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete' | 'revised'>('all');
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  
  // Form state for new lecture
  const [newLecture, setNewLecture] = useState<NewLecture>({
    title: '',
    description: '',
    subject_id: subjectId || '',
    importance: 'medium'
  });
  
  // Form state for scheduling
  const [scheduleDate, setScheduleDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [enableNotification, setEnableNotification] = useState<boolean>(true);

  // Fetch subject info
  const subjectInfo = subjectId ? GATE_SUBJECTS[subjectId as keyof typeof GATE_SUBJECTS] : null;

  // Fetch lectures for this subject
  const { data: dbLectures = [], isLoading } = useQuery({
    queryKey: ['subject-lectures', subjectId],
    queryFn: async () => {
      if (!subjectId) throw new Error('Subject ID is required');
      
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('subject_name', GATE_SUBJECTS[subjectId as keyof typeof GATE_SUBJECTS]?.name)
        .order('created_at', { ascending: true });
      
      if (error) {
        toast.error('Error loading lectures', { description: error.message });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user && !!subjectId
  });

  // Transform DB lectures to UI lectures with default values for missing fields
  const lectures: Lecture[] = dbLectures.map((lecture: DBLecture) => {
    // Get scheduling information from localStorage
    const scheduleKey = `lecture_schedule_${lecture.id}`;
    const scheduleInfo = localStorage.getItem(scheduleKey);
    let scheduledDate = undefined;
    let scheduledTime = undefined;
    
    if (scheduleInfo) {
      try {
        const parsed = JSON.parse(scheduleInfo);
        scheduledDate = parsed.date;
        scheduledTime = parsed.time;
      } catch (e) {
        console.error('Error parsing schedule info', e);
      }
    }
    
    return {
      ...lecture,
      revised: false, // Default value since it's not in DB yet
      importance: 'medium', // Default value since it's not in DB yet
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime
    };
  });

  // Create a new lecture
  const createLecture = useMutation({
    mutationFn: async (lecture: NewLecture) => {
      const { data, error } = await supabase
        .from('lectures')
        .insert([
          {
            user_id: user?.id,
            title: lecture.title,
            description: lecture.description,
            subject_id: null, // Set to null since we're using subject_name
            subject_name: GATE_SUBJECTS[lecture.subject_id as keyof typeof GATE_SUBJECTS]?.name,
            completed: false
            // We'll add the revised and importance fields when we update the database schema
          }
        ])
        .select();
      
      if (error) {
        toast.error('Error creating lecture', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-lectures', subjectId] });
      toast.success('Lecture added successfully');
      setIsAddLectureOpen(false);
      setNewLecture({
        title: '',
        description: '',
        subject_id: subjectId || '',
        importance: 'medium'
      });
    }
  });

  // Toggle lecture completed status
  const toggleLectureStatus = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'completed' | 'revised'; value: boolean }) => {
      // For now, we only update 'completed' in the database
      if (field === 'completed') {
        const { error } = await supabase
          .from('lectures')
          .update({ 
            completed: value,
            updated_at: new Date().toISOString() 
          })
          .eq('id', id);
        
        if (error) {
          toast.error(`Error updating lecture`, { description: error.message });
          throw error;
        }
      } else {
        // For 'revised', we just update the UI state for now
        // This would be implemented in the database later
        toast.success(`Lecture ${value ? 'marked as revised' : 'revision status removed'}`);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subject-lectures', subjectId] });
      if (variables.field === 'completed') {
        toast.success(`Lecture ${variables.value ? 'marked as completed' : 'marked as incomplete'}`);
      }
    }
  });

  // Schedule a lecture
  const scheduleLecture = useMutation({
    mutationFn: async ({ id, date, time, notify }: { id: string; date: string; time: string; notify: boolean }) => {
      // Store all scheduling information in localStorage since the columns don't exist in the database
      const scheduleKey = `lecture_schedule_${id}`;
      localStorage.setItem(scheduleKey, JSON.stringify({ date, time }));
      
      // Store notification preference separately
      if (notify) {
        const notificationKey = `lecture_notification_${id}`;
        localStorage.setItem(notificationKey, 'true');
        
        // Get lecture title
        const lecture = lectures.find(l => l.id === id);
        
        // Notify the service worker for scheduling notifications
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_NOTIFICATION',
            id,
            title: lecture?.title || 'Scheduled Lecture',
            time,
            date,
            subjectId
          });
        }
      } else {
        const notificationKey = `lecture_notification_${id}`;
        localStorage.removeItem(notificationKey);
      }
      
      // We'll only update the updated_at field in the database
      const { error } = await supabase
        .from('lectures')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (error) {
        toast.error('Error updating lecture', { description: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-lectures', subjectId] });
      toast.success('Lecture scheduled successfully');
      if (enableNotification) {
        toast.success('Notification will be sent when it\'s time for your lecture');
      }
      setSelectedLecture(null);
    }
  });

  // Delete a lecture
  const deleteLecture = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Error deleting lecture', { description: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-lectures', subjectId] });
      toast.success('Lecture deleted successfully');
    }
  });

  // Handle adding a new lecture
  const handleAddLecture = () => {
    if (!newLecture.title) {
      toast.error('Title is required');
      return;
    }
    
    createLecture.mutate(newLecture);
  };

  // Handle scheduling a lecture
  const handleScheduleLecture = () => {
    if (!selectedLecture) return;
    
    scheduleLecture.mutate({
      id: selectedLecture.id,
      date: scheduleDate,
      time: scheduleTime,
      notify: enableNotification
    });
  };

  // Handle deleting a lecture with confirmation
  const handleDeleteLecture = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteLecture.mutate(id);
    }
  };

  // Filter lectures based on search and status
  const filteredLectures = lectures.filter((lecture) => {
    const matchesSearch = !searchQuery || 
      lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (lecture.description && lecture.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && lecture.completed) || 
      (statusFilter === 'incomplete' && !lecture.completed) ||
      (statusFilter === 'revised' && lecture.revised);
    
    return matchesSearch && matchesStatus;
  });

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    // Set up notification checking interval
    const notificationInterval = setInterval(() => {
      checkAndTriggerNotifications();
    }, 60000); // Check every minute
    
    // Run once on component mount
    checkAndTriggerNotifications();
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, []);
  
  // Cache lecture data in localStorage for notifications
  useEffect(() => {
    if (lectures && lectures.length > 0) {
      lectures.forEach(lecture => {
        const cacheKey = `lecture_data_${lecture.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          id: lecture.id,
          title: lecture.title
        }));
      });
    }
  }, [lectures]);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'CHECK_LECTURES') {
        checkAndTriggerNotifications();
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  // If no subject ID or invalid subject ID
  if (!subjectId || !subjectInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-4">Subject not found</h2>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{subjectInfo.name}</h1>
        </div>
        
        <Dialog open={isAddLectureOpen} onOpenChange={setIsAddLectureOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lecture</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Lecture Title</Label>
                <Input 
                  id="title" 
                  value={newLecture.title}
                  onChange={(e) => setNewLecture({...newLecture, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={newLecture.description}
                  onChange={(e) => setNewLecture({...newLecture, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Importance</Label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <Button 
                      key={level} 
                      type="button"
                      variant={newLecture.importance === level ? 'default' : 'outline'}
                      onClick={() => setNewLecture({...newLecture, importance: level as 'high' | 'medium' | 'low'})}
                      className="flex-1"
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsAddLectureOpen(false)}>Cancel</Button>
                <Button onClick={handleAddLecture} disabled={createLecture.isPending}>
                  {createLecture.isPending ? 'Adding...' : 'Add Lecture'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lectures..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button 
          onClick={() => setIsAddLectureOpen(true)}
          className="sm:self-start"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lecture
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant={statusFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('all')}
            className="flex-1 sm:flex-none"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === 'completed' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('completed')}
            className="flex-1 sm:flex-none"
          >
            Completed
          </Button>
          <Button 
            variant={statusFilter === 'incomplete' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('incomplete')}
            className="flex-1 sm:flex-none"
          >
            Incomplete
          </Button>
          <Button 
            variant={statusFilter === 'revised' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setStatusFilter('revised')}
            className="flex-1 sm:flex-none"
          >
            Revised
          </Button>
        </div>
      </div>
      
      {/* Lecture Cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading lectures...</p>
        </div>
      ) : filteredLectures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No lectures found. Add your first lecture to start tracking.</p>
            <Button onClick={() => setIsAddLectureOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lecture
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLectures.map((lecture, index) => (
            <Card key={lecture.id} className={`overflow-hidden ${lecture.completed ? 'bg-muted/30' : ''}`}>
              <div className={`h-1 bg-gradient-to-r ${subjectInfo.color}`}></div>
              <CardHeader className="p-4 pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className={`text-lg ${lecture.completed ? 'text-muted-foreground' : ''}`}>
                      <span className="inline-flex items-center justify-center w-6 h-6 mr-2 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                        {index + 1}
                      </span>
                      {lecture.title}
                    </CardTitle>
                    {lecture.scheduled_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Scheduled: {lecture.scheduled_date}
                          {lecture.scheduled_time && ` at ${lecture.scheduled_time}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={lecture.importance === 'high' ? 'destructive' : lecture.importance === 'medium' ? 'default' : 'outline'}>
                        {lecture.importance}
                      </Badge>
                      {lecture.completed && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                          Completed
                        </Badge>
                      )}
                      {lecture.revised && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                          Revised
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive ml-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {lecture.description && (
                  <p className={`text-sm mb-4 ${lecture.completed ? 'text-muted-foreground' : ''}`}>
                    {lecture.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant={lecture.completed ? "default" : "outline"} 
                    size="sm"
                    onClick={() => toggleLectureStatus.mutate({ 
                      id: lecture.id, 
                      field: 'completed', 
                      value: !lecture.completed 
                    })}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {lecture.completed ? 'Completed' : 'Mark Complete'}
                  </Button>
                  
                  <Button 
                    variant={lecture.revised ? "default" : "outline"} 
                    size="sm"
                    onClick={() => toggleLectureStatus.mutate({ 
                      id: lecture.id, 
                      field: 'revised', 
                      value: !lecture.revised 
                    })}
                    className="flex-1"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {lecture.revised ? 'Revised' : 'Mark Revised'}
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedLecture(lecture);
                          
                          // Get schedule from localStorage
                          const scheduleKey = `lecture_schedule_${lecture.id}`;
                          const scheduleInfo = localStorage.getItem(scheduleKey);
                          let date = format(new Date(), 'yyyy-MM-dd');
                          let time = '09:00';
                          
                          if (scheduleInfo) {
                            try {
                              const parsed = JSON.parse(scheduleInfo);
                              date = parsed.date || date;
                              time = parsed.time || time;
                            } catch (e) {
                              console.error('Error parsing schedule info', e);
                            }
                          }
                          
                          setScheduleDate(date);
                          setScheduleTime(time);
                          
                          // Check localStorage for notification preference
                          const notificationKey = `lecture_notification_${lecture.id}`;
                          const hasNotification = localStorage.getItem(notificationKey) === 'true';
                          setEnableNotification(hasNotification || true);
                          setIsScheduleOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Lecture</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="date">Select Date</Label>
                          <Input 
                            id="date" 
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            min={format(new Date(), 'yyyy-MM-dd')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Select Time</Label>
                          <Input 
                            id="time" 
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="enableNotification"
                              checked={enableNotification}
                              onChange={(e) => setEnableNotification(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <Label htmlFor="enableNotification">Enable notification alarm</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            You'll receive a notification on your phone when it's time for this lecture.
                          </p>
                          {enableNotification && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                // Request permission if not granted
                                if (Notification.permission !== 'granted') {
                                  Notification.requestPermission().then(permission => {
                                    if (permission === 'granted') {
                                      new Notification('Test Notification', {
                                        body: 'Notifications are working! You will be notified when your lecture starts.',
                                        icon: '/favicons/apple-touch-icon.png'
                                      });
                                    } else {
                                      toast.error('Notification permission denied. Please enable notifications in your browser settings.');
                                    }
                                  });
                                } else {
                                  // Show test notification
                                  new Notification('Test Notification', {
                                    body: 'Notifications are working! You will be notified when your lecture starts.',
                                    icon: '/favicons/apple-touch-icon.png'
                                  });
                                }
                              }}
                            >
                              Test Notification
                            </Button>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            onClick={handleScheduleLecture} 
                            disabled={scheduleLecture.isPending}
                          >
                            {scheduleLecture.isPending ? 'Scheduling...' : 'Schedule'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectLectures; 