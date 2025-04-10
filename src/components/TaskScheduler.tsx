
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, CheckSquare, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
      queryClient.invalidateQueries({ queryKey: ['tasks', date ? format(date, 'yyyy-MM-dd') : ''] });
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
      queryClient.invalidateQueries({ queryKey: ['tasks', date ? format(date, 'yyyy-MM-dd') : ''] });
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
      queryClient.invalidateQueries({ queryKey: ['tasks', date ? format(date, 'yyyy-MM-dd') : ''] });
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

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Task Scheduler</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Daily Tasks</CardTitle>
                  <CardDescription>
                    {date ? format(date, 'PPP') : 'Select a date'}
                  </CardDescription>
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-10 p-0">
                      <CalendarIcon className="h-4 w-4" />
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
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {tasksLoading ? (
                  <div className="text-center py-4">Loading tasks...</div>
                ) : tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleToggleComplete(task.id, task.completed)}>
                          <CheckSquare 
                            className={`h-5 w-5 ${task.completed ? 'text-green-500 fill-green-500' : 'text-muted-foreground'}`} 
                          />
                        </button>
                        <div className={task.completed ? "line-through text-muted-foreground" : ""}>
                          <p className="font-medium">{task.title}</p>
                          <div className="flex text-sm text-muted-foreground gap-3">
                            <span>{task.subject_name}</span>
                            <span>•</span>
                            <span>{task.time} ({task.duration}h)</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks scheduled for this day
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Task</CardTitle>
              <CardDescription>Schedule your study tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input 
                  id="title" 
                  placeholder="What to study..." 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  onValueChange={(value) => setNewTask({...newTask, subject_id: value})}
                  value={newTask.subject_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={newTask.time}
                    onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    placeholder="1.5" 
                    value={newTask.duration}
                    onChange={(e) => setNewTask({...newTask, duration: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleAddTask}
                disabled={addTask.isPending}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
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
