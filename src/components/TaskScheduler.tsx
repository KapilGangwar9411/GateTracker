import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarIcon, 
  CheckSquare, 
  PlusCircle, 
  Trash2, 
  ClockIcon, 
  BookOpen, 
  ListTodo, 
  Calendar as CalendarIcon2, 
  CheckCircle2, 
  ArrowUpFromLine,
  Clock
} from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Task = {
  id: string;
  title: string;
  subject_id: string;
  subject_name?: string;
  scheduled_date: string;
  time: string;
  duration: string;
  completed: boolean;
};

const TaskScheduler = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [newTask, setNewTask] = useState({
    title: "",
    subject_id: "",
    time: "",
    duration: ""
  });
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  // Fetch tasks for the selected date
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', date ? format(date, 'yyyy-MM-dd') : ''],
    queryFn: async () => {
      if (!date) return [];
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data: tasksData, error } = await supabase
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
        .eq('scheduled_date', formattedDate)
        .order('time');
      
      if (error) {
        toast.error('Error loading tasks', { description: error.message });
        throw error;
      }
      
      return (tasksData || []).map((task: any) => ({
        ...task,
        subject_name: task.subjects?.name || 'No Subject'
      }));
    },
    enabled: !!user && !!date
  });

  // Fetch all upcoming tasks
  const { data: allTasks = [], isLoading: allTasksLoading } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: async () => {
      const { data: tasksData, error } = await supabase
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
        .order('scheduled_date', { ascending: true })
        .order('time');
      
      if (error) {
        toast.error('Error loading tasks', { description: error.message });
        throw error;
      }
      
      return (tasksData || []).map((task: any) => ({
        ...task,
        subject_name: task.subjects?.name || 'No Subject'
      }));
    },
    enabled: !!user
  });

  // Fetch subjects for the dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) {
        toast.error('Error loading subjects', { description: error.message });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Add a new task
  const addTask = useMutation({
    mutationFn: async (task: {
      title: string;
      subject_id: string;
      scheduled_date: string;
      time: string;
      duration: string;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: user?.id,
            ...task,
            completed: false
          }
        ])
        .select();
      
      if (error) {
        toast.error('Error adding task', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      setNewTask({ title: "", subject_id: "", time: "", duration: "" });
      toast.success('Task added successfully');
    }
  });

  // Delete a task
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Error deleting task', { description: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      toast.success('Task deleted');
    }
  });

  // Toggle task completion
  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', id);
      
      if (error) {
        toast.error('Error updating task', { description: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
    }
  });

  const handleAddTask = () => {
    if (!newTask.title || !newTask.subject_id || !newTask.time || !newTask.duration || !date) {
      toast.error('Please fill all fields', { description: 'All fields are required' });
      return;
    }
    
    addTask.mutate({
      title: newTask.title,
      subject_id: newTask.subject_id,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      time: newTask.time,
      duration: newTask.duration
    });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate(id);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    toggleComplete.mutate({ id, completed: !completed });
  };

  // Filter tasks based on tab
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'upcoming') return !task.completed;
    return task.completed;
  });

  // Get all upcoming tasks (not completed)
  const upcomingTasks = allTasks.filter(task => !task.completed);
  
  // Get tasks by time period
  const todayTasks = upcomingTasks.filter(task => 
    isToday(parseISO(task.scheduled_date))
  );
  
  const tomorrowTasks = upcomingTasks.filter(task => 
    isTomorrow(parseISO(task.scheduled_date))
  );
  
  const thisWeekTasks = upcomingTasks.filter(task => 
    isThisWeek(parseISO(task.scheduled_date)) && 
    !isToday(parseISO(task.scheduled_date)) && 
    !isTomorrow(parseISO(task.scheduled_date))
  );

  // Get completed tasks
  const completedTasks = allTasks.filter(task => task.completed);
  const completedCount = completedTasks.length;
  const totalCount = allTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Render a task item
  const renderTaskItem = (task: Task) => (
    <div 
      key={task.id} 
      className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg mb-2
        ${task.completed ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors'}
      `}
    >
      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
        <button 
          onClick={() => handleToggleComplete(task.id, task.completed)}
          className={`p-1 rounded-full flex-shrink-0 ${task.completed ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <CheckSquare 
            className={`h-4 w-4 sm:h-5 sm:w-5 ${task.completed ? 'text-green-500 fill-green-500' : 'text-muted-foreground'}`} 
          />
        </button>
        <div className={`${task.completed ? "line-through text-muted-foreground" : ""} min-w-0`}>
          <p className="font-medium text-sm sm:text-base truncate">{task.title}</p>
          <div className="flex flex-wrap text-xs sm:text-sm text-muted-foreground gap-2 sm:gap-3 mt-1">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span className="truncate max-w-[100px] sm:max-w-none">{task.subject_name}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.time}
            </span>
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {task.duration}h
            </span>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="opacity-50 hover:opacity-100 h-8 w-8 flex-shrink-0">
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-2xl overflow-hidden shadow-lg mb-4 sm:mb-8">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#smallGrid)" />
          </svg>
        </div>
        
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                  <ListTodo className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Task Scheduler</h2>
                  <p className="text-blue-100 text-sm sm:text-base">Plan and organize your study sessions</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-full bg-white/10">
                    <CalendarIcon2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-blue-100">Today</p>
                    <p className="text-lg sm:text-xl font-bold">{todayTasks.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-full bg-white/10">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-blue-100">Completed</p>
                    <p className="text-lg sm:text-xl font-bold">{completedCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3 border border-white/5">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-full bg-white/10">
                    <ArrowUpFromLine className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-blue-100">Success Rate</p>
                    <p className="text-lg sm:text-xl font-bold">{completionRate}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Task Overview */}
        <div className="md:col-span-2 space-y-4 sm:space-y-6">
          {/* Calendar and Date Selection */}
          <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
            <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-2 border-b border-gray-100 dark:border-gray-800 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    {date ? (
                      <>
                        {isToday(date) ? 'Today' : format(date, 'PPP')}
                        <Badge variant="outline" className="ml-2 capitalize text-[10px] sm:text-xs">
                          {format(date, 'EEEE')}
                        </Badge>
                      </>
                    ) : (
                      'Select a date'
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {`${filteredTasks.length} ${activeTab === 'upcoming' ? 'upcoming' : 'completed'} tasks`}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2 sm:mt-0 mt-2">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upcoming' | 'completed')}>
                    <TabsList className="grid grid-cols-2 h-7 sm:h-8">
                      <TabsTrigger value="upcoming" className="text-[10px] sm:text-xs px-2">Upcoming</TabsTrigger>
                      <TabsTrigger value="completed" className="text-[10px] sm:text-xs px-2">Completed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 sm:h-8 gap-1">
                        <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:text-xs">Calendar</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 sm:p-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {tasksLoading ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="inline-block p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 animate-pulse" />
                  </div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading tasks...</p>
                </div>
              ) : filteredTasks.length > 0 ? (
                <div className="space-y-1">
                  {filteredTasks.map(renderTaskItem)}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="inline-block p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                    <ListTodo className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">No {activeTab} tasks</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                    {activeTab === 'upcoming' 
                      ? 'You have no upcoming tasks scheduled for this day. Add a new task to get started.' 
                      : 'You have no completed tasks for this day.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Task Timeline */}
          <Card>
            <CardHeader className="bg-gray-50 dark:bg-gray-800/50 pb-2 border-b border-gray-100 dark:border-gray-800 p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Upcoming Tasks</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your task timeline for the coming days</CardDescription>
            </CardHeader>
            
            <CardContent className="p-3 sm:p-4 divide-y divide-gray-100 dark:divide-gray-800">
              {allTasksLoading ? (
                <div className="text-center py-6 sm:py-8 text-sm sm:text-base">Loading tasks...</div>
              ) : (
                <>
                  {/* Today's tasks */}
                  {todayTasks.length > 0 && (
                    <div className="py-2 sm:py-3">
                      <h3 className="flex items-center gap-2 font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                        <Badge variant="default" className="rounded-md bg-blue-500 text-[10px] sm:text-xs">Today</Badge>
                        <span>{format(new Date(), 'EEEE, MMMM d')}</span>
                      </h3>
                      <div className="space-y-1 pl-3 sm:pl-4 border-l-2 border-blue-500">
                        {todayTasks.map(renderTaskItem)}
                      </div>
                    </div>
                  )}
                  
                  {/* Tomorrow's tasks */}
                  {tomorrowTasks.length > 0 && (
                    <div className="py-2 sm:py-3">
                      <h3 className="flex items-center gap-2 font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                        <Badge variant="outline" className="rounded-md text-[10px] sm:text-xs">Tomorrow</Badge>
                        <span>{format(new Date(new Date().setDate(new Date().getDate() + 1)), 'EEEE, MMMM d')}</span>
                      </h3>
                      <div className="space-y-1 pl-3 sm:pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        {tomorrowTasks.map(renderTaskItem)}
                      </div>
                    </div>
                  )}
                  
                  {/* This week's tasks */}
                  {thisWeekTasks.length > 0 && (
                    <div className="py-2 sm:py-3">
                      <h3 className="flex items-center gap-2 font-medium text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                        <Badge variant="outline" className="rounded-md text-[10px] sm:text-xs">This Week</Badge>
                        <span>Next few days</span>
                      </h3>
                      <div className="space-y-1 pl-3 sm:pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        {thisWeekTasks.map(renderTaskItem)}
                      </div>
                    </div>
                  )}
                  
                  {/* If no upcoming tasks */}
                  {upcomingTasks.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                      <p>No upcoming tasks scheduled</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Add New Task Form */}
        <div>
          <Card className="border-gray-200 dark:border-gray-800 lg:sticky lg:top-4">
            <CardHeader className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-b border-gray-100 dark:border-gray-800 p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Add New Task</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Schedule your study tasks</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="title" className="text-xs sm:text-sm font-medium">Task Title</Label>
                <Input 
                  id="title" 
                  placeholder="What to study..." 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="border-gray-200 dark:border-gray-700 text-sm"
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="subject" className="text-xs sm:text-sm font-medium">Subject</Label>
                <Select 
                  onValueChange={(value) => setNewTask({...newTask, subject_id: value})}
                  value={newTask.subject_id}
                >
                  <SelectTrigger className="border-gray-200 dark:border-gray-700 text-sm h-9">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Task Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-gray-200 dark:border-gray-700 text-sm h-9"
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="time" className="text-xs sm:text-sm font-medium">Start Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={newTask.time}
                    onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                    className="border-gray-200 dark:border-gray-700 text-sm h-9"
                  />
                </div>
                
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="duration" className="text-xs sm:text-sm font-medium">Duration (hours)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    placeholder="1.5" 
                    value={newTask.duration}
                    onChange={(e) => setNewTask({...newTask, duration: e.target.value})}
                    className="border-gray-200 dark:border-gray-700 text-sm h-9"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-800 p-3 sm:p-4">
              <Button 
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-sm h-9" 
                onClick={handleAddTask}
                disabled={addTask.isPending}
              >
                <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                {addTask.isPending ? 'Adding...' : 'Add Task'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskScheduler;
