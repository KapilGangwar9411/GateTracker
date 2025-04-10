import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Edit2, PlusCircle, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Note } from '@/types/database.types';

type NoteFormData = {
  title: string;
  content: string;
};

const QuickNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState<NoteFormData>({ title: "", content: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NoteFormData>({ title: "", content: "" });

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Error loading notes', { description: error.message });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user
  });

  // Add a note
  const addNote = useMutation({
    mutationFn: async (note: NoteFormData) => {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            user_id: user?.id,
            ...note
          }
        ])
        .select();
      
      if (error) {
        toast.error('Error adding note', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setNewNote({ title: "", content: "" });
      toast.success('Note added successfully');
    }
  });

  // Update a note
  const updateNote = useMutation({
    mutationFn: async ({ id, ...note }: { id: string; title: string; content: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          ...note,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) {
        toast.error('Error updating note', { description: error.message });
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditingId(null);
      setEditForm({ title: "", content: "" });
      toast.success('Note updated successfully');
    }
  });

  // Delete a note
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error('Error deleting note', { description: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (editingId) {
        setEditingId(null);
        setEditForm({ title: "", content: "" });
      }
      toast.success('Note deleted successfully');
    }
  });

  const handleAddNote = () => {
    if (newNote.title && newNote.content) {
      addNote.mutate(newNote);
    } else {
      toast.error('Please fill all fields', { description: 'Title and content are required' });
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditForm({ title: note.title, content: note.content || "" });
  };

  const saveEdit = () => {
    if (editingId && editForm.title && editForm.content) {
      updateNote.mutate({
        id: editingId,
        title: editForm.title,
        content: editForm.content
      });
    } else {
      toast.error('Please fill all fields', { description: 'Title and content are required' });
    }
  };

  const handleDeleteNote = (id: string) => {
    deleteNote.mutate(id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Quick Notes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Note</CardTitle>
              <CardDescription>Capture important concepts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input 
                  placeholder="Note title" 
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>
              <div>
                <Textarea 
                  placeholder="Note content..." 
                  className="min-h-32" 
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleAddNote}
                disabled={addNote.isPending}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {addNote.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading notes...</div>
            ) : notes.length > 0 ? (
              notes.map((note: Note) => (
                <Card key={note.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      {editingId === note.id ? (
                        <Input 
                          value={editForm.title} 
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="font-medium"
                        />
                      ) : (
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                      )}
                      <div className="flex space-x-1">
                        {editingId === note.id ? (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={saveEdit}
                            disabled={updateNote.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => startEditing(note)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deleteNote.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {formatDate(note.updated_at)}
                      {note.created_at !== note.updated_at ? ' (edited)' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editingId === note.id ? (
                      <Textarea 
                        value={editForm.content} 
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        className="min-h-24"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{note.content}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No notes yet. Add your first note!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickNotes;
