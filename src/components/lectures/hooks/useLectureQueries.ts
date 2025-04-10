import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lecture } from '@/types/database.types';
import { LecturesQueryResult, SubjectsQueryResult } from './lectureTypes';

export const useLectureQueries = (): LecturesQueryResult & SubjectsQueryResult => {
  const { user } = useAuth();

  // Fetch lectures from Supabase
  const { data: lectures = [], isLoading } = useQuery({
    queryKey: ['lectures', user?.id],
    queryFn: async () => {
      try {
        console.log('Fetching lectures for user:', user?.id);
        
        if (!user) {
          console.warn('No user found, skipping lecture fetch');
          return [];
        }
        
        const { data, error } = await supabase
          .from('lectures')
          .select(`
            *,
            subjects (name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading lectures', error);
          toast.error('Error loading lectures', { description: error.message });
          throw error;
        }
        
        console.log('Lectures data from API:', data);
        
        return (data || []).map((lecture: any) => ({
          ...lecture,
          subject_name: lecture.subjects?.name || 'No Subject'
        }));
      } catch (err: any) {
        console.error('Unexpected error in lectures query', err);
        toast.error('Error loading lectures', { description: err.message });
        return [];
      }
    },
    enabled: !!user
  });

  // Fetch subjects for dropdown (only id and name needed for the dropdowns)
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-dropdown', user?.id],
    queryFn: async () => {
      try {
        if (!user) {
          return [];
        }
        
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name');
        
        if (error) {
          console.error('Error loading subjects', error);
          toast.error('Error loading subjects', { description: error.message });
          throw error;
        }
        
        return data || [];
      } catch (err: any) {
        console.error('Unexpected error in subjects query', err);
        toast.error('Error loading subjects', { description: err.message });
        return [];
      }
    },
    enabled: !!user
  });

  return {
    lectures,
    isLoading,
    subjects
  };
};
