import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ScheduledLecture = {
  id: string;
  lecture_id: string;
  date: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  lecture?: {
    title: string;
    subject_id: string;
    subjects?: {
      name: string;
    }
  };
};

export function useScheduler() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch scheduled lectures
  const { data: scheduledLectures = [], isLoading } = useQuery({
    queryKey: ['scheduled-lectures', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('scheduled_lectures')
        .select(`
          *,
          lecture:lecture_id(
            title,
            subject_id,
            subjects(name)
          )
        `)
        .eq('user_id', userId);
        
      if (error) {
        toast.error('Failed to load scheduled lectures');
        return [];
      }
      
      return data;
    },
    enabled: !!userId
  });

  // Create scheduled lecture
  const createSchedule = useMutation({
    mutationFn: async (schedule: Omit<ScheduledLecture, 'id'>) => {
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('scheduled_lectures')
        .insert([{
          ...schedule,
          user_id: userId
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Lecture scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['scheduled-lectures'] });
    },
    onError: (error) => {
      toast.error(`Failed to schedule lecture: ${error.message}`);
    }
  });

  // Toggle completion status
  const toggleComplete = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      
      const schedule = scheduledLectures.find(s => s.id === id);
      if (!schedule) throw new Error('Schedule not found');
      
      const { data, error } = await supabase
        .from('scheduled_lectures')
        .update({ completed: !schedule.completed })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-lectures'] });
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    }
  });

  // Delete scheduled lecture
  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('scheduled_lectures')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success('Schedule deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduled-lectures'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    }
  });

  return {
    scheduledLectures,
    isLoading,
    createSchedule,
    toggleComplete,
    deleteSchedule
  };
} 