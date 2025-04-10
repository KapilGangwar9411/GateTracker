import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lecture } from '@/types/database.types';
import { NewLectureState } from './lectureTypes';
import type { PostgrestError } from '@supabase/supabase-js';

export const useLectureMutations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Create a new lecture
  const createLecture = useMutation({
    mutationFn: async (lecture: NewLectureState) => {
      try {
        console.log('Creating lecture:', lecture);
        
        // Fetch subject name if subject_id is provided
        let subjectName = '';
        if (lecture.subject_id) {
          const { data: subjectData } = await supabase
            .from('subjects')
            .select('name')
            .eq('id', lecture.subject_id)
            .single();
            
          if (subjectData) {
            subjectName = subjectData.name;
          }
        }
        
        // Include all required fields, including status and subject_name
        const { data, error } = await supabase
          .from('lectures')
          .insert([
            {
              user_id: user?.id,
              title: lecture.title,
              description: lecture.description,
              subject_id: lecture.subject_id,
              subject_name: subjectName,
              status: lecture.status || 'not_started',
              completed: lecture.status === 'completed',
              revision_count: 0,
              last_revised: null,
              next_revision_date: null,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
          ])
          .select();
        
        if (error) {
          console.error('Error creating lecture:', error);
          toast.error('Error creating lecture', { description: error.message });
          throw error;
        }
        
        return data;
      } catch (error: unknown) {
        console.error('Error in createLecture:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Failed to create lecture', { description: errorMessage });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success('Lecture created successfully');
    }
  });

  // Update a lecture
  const updateLecture = useMutation({
    mutationFn: async (lecture: Lecture) => {
      try {
        // Fetch subject name if subject_id is provided and subject_name is not
        let subjectName = lecture.subject_name;
        if (lecture.subject_id && !subjectName) {
          const { data: subjectData } = await supabase
            .from('subjects')
            .select('name')
            .eq('id', lecture.subject_id)
            .single();
            
          if (subjectData) {
            subjectName = subjectData.name;
          }
        }
        
        // Include status field and subject_name in the update
        const { data, error } = await supabase
          .from('lectures')
          .update({
            title: lecture.title,
            description: lecture.description,
            subject_id: lecture.subject_id,
            subject_name: subjectName,
            status: lecture.status || 'not_started',
            completed: lecture.status === 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', lecture.id)
          .select();
        
        if (error) {
          console.error('Error updating lecture:', error);
          toast.error('Error updating lecture', { description: error.message });
          throw error;
        }
        
        return data;
      } catch (error: unknown) {
        console.error('Error in updateLecture:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Error updating lecture', { description: errorMessage });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success('Lecture updated successfully');
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
        console.error('Error deleting lecture:', error);
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
      try {
        const { error } = await supabase
          .from('lectures')
          .update({ 
            completed: !completed,
            status: !completed ? 'completed' : 'not_started'
          })
          .eq('id', id);
        
        if (error) {
          console.error('Error toggling lecture completion:', error);
          toast.error('Error updating lecture', { description: error.message });
          throw error;
        }
      } catch (error: unknown) {
        console.error('Error in toggleLectureCompleted:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Error updating lecture', { description: errorMessage });
        throw error;
      }
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success(`Lecture marked as ${!completed ? 'completed' : 'incomplete'}`);
    }
  });

  // Mark lecture as revised
  const markLectureRevision = useMutation({
    mutationFn: async (id: string) => {
      try {
        const now = new Date();
        
        // First get the current revision count
        const { data: lectureData } = await supabase
          .from('lectures')
          .select('revision_count')
          .eq('id', id)
          .single();
        
        const currentRevisionCount = lectureData?.revision_count || 0;
        
        // Then update with the incremented count
        const { error } = await supabase
          .from('lectures')
          .update({
            status: 'needs_revision',
            last_revised: now.toISOString(),
            revision_count: currentRevisionCount + 1,
            // Set next revision date to 7 days from now
            next_revision_date: new Date(now.setDate(now.getDate() + 7)).toISOString()
          })
          .eq('id', id);
        
        if (error) {
          console.error('Error marking revision:', error);
          toast.error('Error marking revision', { description: error.message });
          throw error;
        }
      } catch (error: unknown) {
        console.error('Error in markLectureRevision:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast.error('Error marking revision', { description: errorMessage });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['lectures-stats'] });
      toast.success('Revision marked successfully');
    }
  });

  return {
    createLecture,
    updateLecture,
    deleteLecture,
    toggleLectureCompleted,
    markLectureRevision
  };
};
