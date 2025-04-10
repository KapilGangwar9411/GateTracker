
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Subject = {
  id: string;
  name: string;
  total_topics: number;
  completed_topics: number;
  color: string;
};

const SubjectTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    total_topics: 0,
    color: 'bg-blue-500'
  });

  // Fetch subjects from Supabase
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Error loading subjects', { description: error.message });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Create a new subject
  const createSubject = useMutation({
    mutationFn: async (newSubject: { name: string; total_topics: number; color: string }) => {
      const { data, error } = await supabase
        .from('subjects')
        .insert([
          { 
            user_id: user?.id,
            name: newSubject.name,
            total_topics: newSubject.total_topics,
            completed_topics: 0,
            color: newSubject.color
          }
        ])
        .select();
      
      if (error) {
        toast.error('Error creating subject', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Subject created successfully');
      setOpen(false);
      setNewSubject({ name: '', total_topics: 0, color: 'bg-blue-500' });
    }
  });

  // Update subject progress
  const updateProgress = useMutation({
    mutationFn: async ({ id, completed_topics }: { id: string; completed_topics: number }) => {
      const { data, error } = await supabase
        .from('subjects')
        .update({ completed_topics })
        .eq('id', id)
        .select();
      
      if (error) {
        toast.error('Error updating progress', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  });

  const handleCreateSubject = () => {
    if (!newSubject.name || newSubject.total_topics <= 0) {
      toast.error('Invalid input', { description: 'Please fill in all fields correctly' });
      return;
    }
    
    createSubject.mutate(newSubject);
  };

  const handleUpdateProgress = (id: string, total: number, current: number) => {
    // Increment completed topics (not exceeding total)
    const newCompleted = current < total ? current + 1 : 0;
    updateProgress.mutate({ id, completed_topics: newCompleted });
  };

  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const colorOptions = [
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-amber-500', label: 'Amber' },
    { value: 'bg-rose-500', label: 'Rose' },
    { value: 'bg-teal-500', label: 'Teal' },
    { value: 'bg-indigo-500', label: 'Indigo' },
    { value: 'bg-pink-500', label: 'Pink' },
  ];

  if (isLoading) {
    return <div className="py-8 text-center">Loading subjects...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subject Progress</h2>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Create a new subject to track your GATE preparation progress
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject-name">Subject Name</Label>
                <Input 
                  id="subject-name" 
                  placeholder="e.g. Computer Networks"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total-topics">Total Topics</Label>
                <Input 
                  id="total-topics" 
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  value={newSubject.total_topics || ''}
                  onChange={(e) => setNewSubject({ ...newSubject, total_topics: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <div 
                      key={color.value}
                      className={`h-8 rounded-md cursor-pointer ${color.value} ${newSubject.color === color.value ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      onClick={() => setNewSubject({ ...newSubject, color: color.value })}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleCreateSubject} disabled={createSubject.isPending}>
                {createSubject.isPending ? 'Creating...' : 'Create Subject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.length > 0 ? (
          subjects.map((subject: Subject) => {
            const progress = calculateProgress(subject.completed_topics, subject.total_topics);
            
            return (
              <Card key={subject.id} className="overflow-hidden">
                <div className={`h-1 ${subject.color}`}></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.completed_topics} of {subject.total_topics} topics completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2 text-sm justify-between"
                      onClick={() => handleUpdateProgress(subject.id, subject.total_topics, subject.completed_topics)}
                    >
                      {subject.completed_topics < subject.total_topics ? 'Mark topic as complete' : 'Reset progress'}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No subjects added yet. Create your first subject to start tracking your progress.
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectTracker;
