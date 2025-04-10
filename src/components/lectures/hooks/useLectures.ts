import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Lecture } from '@/types/database.types';
import { toast } from 'sonner';

export type SubjectOption = {
  id: string;
  name: string;
};

export type NewLectureState = {
  title: string;
  description: string;
  subject_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
};

export function useLectures() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  
  // State for UI
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [newLecture, setNewLecture] = useState<NewLectureState>({
    title: '',
    description: '',
    subject_id: '',
    status: 'not_started'
  });

  // Fetch lectures
  const { data: lectures = [], isLoading: loadingLectures } = useQuery({
    queryKey: ['lectures', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('lectures')
        .select(`
          *,
          subjects(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        toast.error('Failed to load lectures');
        return [];
      }
      
      return data.map(lecture => ({
        ...lecture,
        subject_name: lecture.subjects?.name
      }));
    },
    enabled: !!userId
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', userId)
        .order('name');
        
      if (error) {
        toast.error('Failed to load subjects');
        return [];
      }
      
      return data;
    },
    enabled: !!userId
  });

  // Create lecture
  const createLecture = useMutation({
    mutationFn: async (lecture: NewLectureState) => {
      if (!userId) throw new Error('User not authenticated');
      
      const subject = subjects.find(s => s.id === lecture.subject_id);
      
      const { data, error } = await supabase
        .from('lectures')
        .insert([{
          ...lecture,
          user_id: userId,
          subject_name: subject?.name || '',
          completed: lecture.status === 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lecture created successfully');
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      setOpen(false);
      setNewLecture({
        title: '',
        description: '',
        subject_id: '',
        status: 'not_started'
      });
    },
    onError: (error) => {
      toast.error(`Failed to create lecture: ${error.message}`);
    }
  });

  // Update lecture
  const updateLecture = useMutation({
    mutationFn: async (lecture: Lecture) => {
      if (!userId) throw new Error('User not authenticated');
      
      const { id, ...lectureData } = lecture;
      
      const { data, error } = await supabase
        .from('lectures')
        .update({
          ...lectureData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lecture updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      setEditOpen(false);
      setCurrentLecture(null);
    },
    onError: (error) => {
      toast.error(`Failed to update lecture: ${error.message}`);
    }
  });

  // Delete lecture
  const deleteLecture = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      toast.success('Lecture deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete lecture: ${error.message}`);
    }
  });

  // CRUD handlers
  const handleCreateLecture = () => {
    if (!newLecture.title || !newLecture.subject_id) {
      toast.error('Title and subject are required');
      return;
    }
    
    createLecture.mutate(newLecture);
  };

  const handleUpdateLecture = (lecture: Lecture) => {
    if (!lecture.title || !lecture.subject_id) {
      toast.error('Title and subject are required');
      return;
    }
    
    updateLecture.mutate(lecture);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    const lecture = lectures.find(l => l.id === id);
    if (!lecture) return;
    
    updateLecture.mutate({
      ...lecture,
      completed: !completed,
      status: !completed ? 'completed' : lecture.status === 'completed' ? 'not_started' : lecture.status,
      updated_at: new Date().toISOString()
    });
  };
  
  const handleMarkRevision = (id: string) => {
    const lecture = lectures.find(l => l.id === id);
    if (!lecture) return;
    
    // Calculate next revision date using spaced repetition algorithm
    const now = new Date();
    const revisionCount = (lecture.revision_count || 0) + 1;
    const daysToAdd = Math.pow(2, revisionCount - 1) * 1; // 1, 2, 4, 8, 16 days
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    
    updateLecture.mutate({
      ...lecture,
      revision_count: revisionCount,
      last_revised: now.toISOString(),
      next_revision_date: nextDate.toISOString(),
      status: 'in_progress',
      updated_at: now.toISOString()
    });
  };
  
  const handleEditLecture = (lecture: Lecture) => {
    setCurrentLecture(lecture);
    setEditOpen(true);
  };
  
  const handleDeleteLecture = (id: string) => {
    if (confirm('Are you sure you want to delete this lecture?')) {
      deleteLecture.mutate(id);
    }
  };

  return {
    lectures,
    loadingLectures,
    subjects,
    open,
    setOpen,
    editOpen,
    setEditOpen,
    currentLecture,
    setCurrentLecture,
    newLecture,
    setNewLecture,
    handleCreateLecture,
    handleUpdateLecture,
    handleEditLecture,
    handleDeleteLecture,
    handleToggleComplete,
    handleMarkRevision,
    createLecture,
    updateLecture
  };
}
