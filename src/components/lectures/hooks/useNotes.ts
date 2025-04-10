import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Note = {
  id: string;
  user_id: string;
  lecture_id: string | null;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  lecture?: {
    title: string;
  };
};

export function useNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          lectures(title)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
        
      if (error) {
        toast.error('Failed to load notes');
        console.error('Error loading notes:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!userId
  });

  // Save note (create or update)
  const saveNote = useMutation({
    mutationFn: async (note: Partial<Note>) => {
      if (!userId) throw new Error('User not authenticated');
      
      if (note.id) {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({
            title: note.title,
            content: note.content,
            lecture_id: note.lecture_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', note.id)
          .eq('user_id', userId) // Security check
          .select();
          
        if (error) {
          toast.error('Failed to update note');
          console.error('Error updating note:', error);
          throw error;
        }
        
        return data[0];
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            user_id: userId,
            title: note.title || 'Untitled Note',
            content: note.content || '',
            lecture_id: note.lecture_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
          
        if (error) {
          toast.error('Failed to create note');
          console.error('Error creating note:', error);
          throw error;
        }
        
        return data[0];
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note saved successfully');
    }
  });

  // Delete note
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Security check
        
      if (error) {
        toast.error('Failed to delete note');
        console.error('Error deleting note:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted successfully');
    }
  });

  return {
    notes,
    isLoading,
    saveNote,
    deleteNote
  };
} 