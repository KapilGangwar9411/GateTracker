import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { format, addDays, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { BellRing, Calendar as CalendarIcon, Check, Trash2, Edit, Clock, Plus, Bell, AlarmClock, BookOpen, Repeat, ChevronRight, MoreVertical, CheckCircle, X, CalendarCheck, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
interface Reminder {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  notes?: string;
  created_at: string;
}

// Mock data - replace with actual backend integration
const mockReminders: Reminder[] = [
  {
    id: '1',
    user_id: 'user-123',
    title: 'Complete Digital Logic Quiz',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    time: '14:00',
    completed: false,
    priority: 'high',
    repeat: 'none',
    notes: 'Focus on Boolean algebra and Karnaugh maps',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'user-123',
    title: 'Review Data Structures Notes',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    completed: true,
    priority: 'medium',
    repeat: 'weekly',
    notes: 'Focus on trees and graphs',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: 'user-123',
    title: 'Study Computer Networks',
    date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    time: '16:30',
    completed: false,
    priority: 'low',
    repeat: 'none',
    notes: 'Focus on transport layer protocols',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: 'user-123',
    title: 'Complete Programming Assignment',
    date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
    time: '23:59',
    completed: false,
    priority: 'high',
    repeat: 'none',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    user_id: 'user-123',
    title: 'Watch OS Lecture',
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    time: '18:00',
    completed: false,
    priority: 'medium',
    repeat: 'none',
    created_at: new Date().toISOString(),
  }
];

const Reminders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    completed: false,
    priority: 'medium',
    repeat: 'none',
  });

  // Function to filter reminders
  const getFilteredReminders = () => {
    switch (activeFilter) {
      case 'today':
        return reminders.filter(r => isToday(new Date(r.date)));
      case 'upcoming':
        return reminders.filter(r => new Date(r.date) > new Date() && !isToday(new Date(r.date)));
      case 'completed':
        return reminders.filter(r => r.completed);
      default:
        return reminders;
    }
  };

  // Sort reminders: overdue first, then by date, then by priority
  const getSortedReminders = (filteredReminders: Reminder[]) => {
    return [...filteredReminders].sort((a, b) => {
      // First sort by completion
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then by date
      const dateA = new Date(a.date + (a.time ? ` ${a.time}` : ' 23:59'));
      const dateB = new Date(b.date + (b.time ? ` ${b.time}` : ' 23:59'));
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // Then by priority
      const priorityMap = { high: 0, medium: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });
  };

  // Format for display
  const formatReminderDate = (date: string, time?: string) => {
    const reminderDate = new Date(date);
    
    let displayDate = '';
    if (isToday(reminderDate)) {
      displayDate = 'Today';
    } else if (isTomorrow(reminderDate)) {
      displayDate = 'Tomorrow';
    } else {
      displayDate = format(reminderDate, 'MMM d, yyyy');
    }
    
    return time ? `${displayDate} at ${time}` : displayDate;
  };

  // Handle reminder status toggle
  const toggleReminderStatus = (id: string) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    ));
    toast.success('Reminder status updated');
  };

  // Delete a reminder
  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
    toast.success('Reminder deleted');
  };

  // Add a new reminder
  const addReminder = () => {
    if (!newReminder.title || !newReminder.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const id = `temp-${Date.now()}`;
    const newItem: Reminder = {
      id,
      user_id: user?.id || 'anonymous',
      title: newReminder.title!,
      date: newReminder.date!,
      time: newReminder.time,
      completed: false,
      priority: newReminder.priority as 'low' | 'medium' | 'high',
      repeat: newReminder.repeat as 'none' | 'daily' | 'weekly' | 'monthly',
      notes: newReminder.notes,
      created_at: new Date().toISOString(),
    };
    
    setReminders(prev => [newItem, ...prev]);
    setNewReminder({
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      completed: false,
      priority: 'medium',
      repeat: 'none',
    });
    setShowAddForm(false);
    toast.success('Reminder added successfully');
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30';
      case 'medium':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30';
      default:
        return '';
    }
  };

  const filteredReminders = getFilteredReminders();
  const sortedReminders = getSortedReminders(filteredReminders);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-2xl p-6 shadow-lg overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#smallGrid)" />
          </svg>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 mb-1">
              <BellRing className="h-5 w-5" />
              <h1 className="text-2xl font-bold tracking-tight">Study Reminders</h1>
            </div>
            <p className="text-sm text-white/80 max-w-md">
              Stay on track with your study tasks and never miss important deadlines
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5">
              <p className="text-xs text-indigo-200 mb-1">Today</p>
              <p className="text-xl font-bold">{reminders.filter(r => isToday(new Date(r.date)) && !r.completed).length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5">
              <p className="text-xs text-indigo-200 mb-1">Upcoming</p>
              <p className="text-xl font-bold">{reminders.filter(r => new Date(r.date) > new Date() && !isToday(new Date(r.date)) && !r.completed).length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5">
              <p className="text-xs text-indigo-200 mb-1">Completed</p>
              <p className="text-xl font-bold">{reminders.filter(r => r.completed).length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        {/* Reminders List */}
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex items-center justify-between">
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full max-w-md">
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="ml-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add
            </Button>
          </div>
          
          {/* Add form */}
          {showAddForm && (
            <Card className="border border-indigo-100 dark:border-indigo-900/30 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b border-indigo-100 dark:border-indigo-950/50 py-4">
                <CardTitle className="text-base font-medium flex items-center">
                  <Plus className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  New Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      placeholder="Enter reminder title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Input 
                        type="date"
                        value={newReminder.date}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Input 
                        type="time"
                        value={newReminder.time}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select 
                      value={newReminder.priority} 
                      onValueChange={(value) => setNewReminder(prev => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Repeat</label>
                    <Select 
                      value={newReminder.repeat} 
                      onValueChange={(value) => setNewReminder(prev => ({ ...prev, repeat: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Don't repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Input 
                    placeholder="Add additional details"
                    value={newReminder.notes || ''}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 py-3 px-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={addReminder} 
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                  size="sm"
                >
                  Add Reminder
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Reminders list */}
          {sortedReminders.length > 0 ? (
            <div className="space-y-3">
              {sortedReminders.map((reminder) => {
                const isOverdue = !reminder.completed && isPast(new Date(reminder.date)) && !isToday(new Date(reminder.date));
                
                return (
                  <Card 
                    key={reminder.id} 
                    className={`bg-white dark:bg-zinc-900 border ${reminder.completed 
                      ? 'border-gray-100 dark:border-gray-800 opacity-75' 
                      : isOverdue 
                        ? 'border-red-100 dark:border-red-900/30' 
                        : 'border-indigo-100 dark:border-indigo-900/30'
                    } shadow-sm overflow-hidden group transition-all`}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start p-4">
                        <div className="mr-3 pt-0.5">
                          <Checkbox 
                            checked={reminder.completed}
                            onCheckedChange={() => toggleReminderStatus(reminder.id)}
                            className={`h-5 w-5 rounded-full border-2 ${reminder.completed 
                              ? 'border-green-500 bg-green-500 text-white' 
                              : isOverdue 
                                ? 'border-red-500' 
                                : 'border-indigo-500'
                            }`}
                          />
                        </div>
                        <div className="flex-grow min-w-0 mr-2">
                          <div className="flex flex-wrap gap-2 mb-1">
                            <h3 className={`text-base font-medium ${reminder.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                              {reminder.title}
                            </h3>
                            
                            <div className="hidden sm:flex flex-wrap gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-gray-400 hover:text-gray-500"
                                onClick={() => deleteReminder(reminder.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            <div className={`flex items-center text-xs ${
                              isOverdue 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {formatReminderDate(reminder.date, reminder.time)}
                                {isOverdue && ' (Overdue)'}
                              </span>
                            </div>
                            
                            {reminder.repeat !== 'none' && (
                              <Badge variant="outline" className="text-xs h-5 border-gray-200 dark:border-gray-700 flex items-center gap-1">
                                <Repeat className="h-3 w-3" />
                                <span className="capitalize">{reminder.repeat}</span>
                              </Badge>
                            )}
                            
                            <Badge variant="outline" className={`text-xs h-5 capitalize ${getPriorityColor(reminder.priority)}`}>
                              {reminder.priority}
                            </Badge>
                          </div>
                          
                          {reminder.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-1">
                              {reminder.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="sm:hidden">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-gray-400"
                            onClick={() => deleteReminder(reminder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <Bell className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No reminders found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {activeFilter === 'all' 
                  ? "You don't have any reminders yet" 
                  : `No ${activeFilter} reminders`}
              </p>
              <Button 
                className="mt-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Reminder
              </Button>
            </div>
          )}
        </div>
        
        {/* Calendar View */}
        <div className="hidden md:block">
          <Card className="bg-white dark:bg-zinc-900 border shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b border-indigo-100 dark:border-indigo-950/50">
              <CardTitle className="text-base font-medium flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Calendar />
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Your Routine</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <AlarmClock className="h-4 w-4 mr-2 text-indigo-500" />
                      <span>Morning Study</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">6:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Lectures</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">10:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-violet-500" />
                      <span>Practice Problems</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">2:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-emerald-500" />
                      <span>Evening Revision</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">7:00 PM</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Reminder Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-indigo-500" />
                      <Label htmlFor="notifications" className="text-sm">Notifications</Label>
                    </div>
                    <Switch id="notifications" checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      <Label htmlFor="advance-reminder" className="text-sm">30 min advance reminder</Label>
                    </div>
                    <Switch id="advance-reminder" checked={true} />
                  </div>
                </div>
              </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
