
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lecture } from '@/types/database.types';

// Define a type for the subject options we're using
type SubjectOption = {
  id: string;
  name: string;
};

export const useLectures = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [newLecture, setNewLecture] = useState({
    title: '',
    description: '',
    subject_id: '',
  });

  // Fetch lectures from Supabase
  const { data: lectures = [], isLoading: loadingLectures } = useQuery({
    queryKey: ['lectures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lectures')
        .select(`
          *,
          subjects (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Error loading lectures', { description: error.message });
        throw error;
      }
      
      return (data || []).map((lecture: any) => ({
        ...lecture,
        subject_name: lecture.subjects?.name || 'No Subject'
      }));
    },
    enabled: !!user
  });

  // Fetch subjects for dropdown (only id and name needed for the dropdowns)
  const { data: subjects = [] } = useQuery<SubjectOption[]>({
    queryKey: ['subjects-dropdown'],
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

  // Create a new lecture
  const createLecture = useMutation({
    mutationFn: async (lecture: { title: string; description: string; subject_id: string }) => {
      const { data, error } = await supabase
        .from('lectures')
        .insert([
          {
            user_id: user?.id,
            title: lecture.title,
            description: lecture.description,
            subject_id: lecture.subject_id,
            completed: false
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
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success('Lecture created successfully');
      setOpen(false);
      setNewLecture({ title: '', description: '', subject_id: '' });
    }
  });

  // Update a lecture
  const updateLecture = useMutation({
    mutationFn: async (lecture: Lecture) => {
      const { data, error } = await supabase
        .from('lectures')
        .update({
          title: lecture.title,
          description: lecture.description,
          subject_id: lecture.subject_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', lecture.id)
        .select();
      
      if (error) {
        toast.error('Error updating lecture', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success('Lecture updated successfully');
      setEditOpen(false);
      setCurrentLecture(null);
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
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success('Lecture deleted successfully');
    }
  });

  // Toggle lecture completion status
  const toggleLectureCompleted = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('lectures')
        .update({ completed: !completed })
        .eq('id', id);
      
      if (error) {
        toast.error('Error updating lecture', { description: error.message });
        throw error;
      }
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success(`Lecture marked as ${!completed ? 'completed' : 'incomplete'}`);
    }
  });

  const handleCreateLecture = () => {
    if (!newLecture.title || !newLecture.subject_id) {
      toast.error('Please fill required fields', { description: 'Title and subject are required' });
      return;
    }
    
    createLecture.mutate(newLecture);
  };

  const handleUpdateLecture = () => {
    if (!currentLecture?.title || !currentLecture?.subject_id) {
      toast.error('Please fill required fields', { description: 'Title and subject are required' });
      return;
    }
    
    updateLecture.mutate(currentLecture);
  };

  const handleEditLecture = (lecture: Lecture) => {
    setCurrentLecture(lecture);
    setEditOpen(true);
  };

  const handleDeleteLecture = (id: string) => {
    deleteLecture.mutate(id);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    toggleLectureCompleted.mutate({ id, completed });
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
    createLecture: { isPending: createLecture.isPending },
    updateLecture: { isPending: updateLecture.isPending }
  };
};
