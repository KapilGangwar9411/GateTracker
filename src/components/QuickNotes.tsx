import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Edit2, PlusCircle, Save, Trash2, BookOpen, StickyNote, Clock, Search, Pin, SortDesc, Filter, LayoutGrid, Star, NotepadText, FileText, StickyNote as StickyNoteIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Note } from '@/types/database.types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

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

  // Sort and filter notes
  const filteredNotes = notes
    .filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else { // alphabetical
        return a.title.localeCompare(b.title);
      }
    });

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
              <StickyNoteIcon className="h-5 w-5" />
              <h1 className="text-2xl font-bold tracking-tight">Study Notes</h1>
            </div>
            <p className="text-sm text-white/80 max-w-md">
              Capture, organize, and review your most important concepts and ideas
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5">
              <p className="text-xs text-indigo-200 mb-1">Total Notes</p>
              <p className="text-xl font-bold">{notes.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/5">
              <p className="text-xs text-indigo-200 mb-1">Last Updated</p>
              <p className="text-xl font-bold">{notes.length > 0 ? formatDate(notes[0].updated_at).split(',')[0] : '—'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create New Note */}
      <Card className="bg-white dark:bg-zinc-900 border shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b border-indigo-100 dark:border-indigo-950/50">
          <CardTitle className="flex items-center text-lg font-medium">
            <NotepadText className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Create New Note
          </CardTitle>
          <CardDescription>
            Document important concepts and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="note-title" className="text-sm font-medium block mb-1.5 text-gray-700 dark:text-gray-300">
                Note Title
              </label>
              <Input 
                id="note-title"
                placeholder="Enter a descriptive title" 
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="sm:flex items-end gap-4">
              <div className="flex-grow mb-4 sm:mb-0">
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white h-10" 
                  onClick={handleAddNote}
                  disabled={addNote.isPending}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {addNote.isPending ? 'Saving...' : 'Save Note'}
                </Button>
              </div>
              
              {/* Search and filters */}
              <div className="relative flex-grow hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search notes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white dark:bg-zinc-900 h-10"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="note-content" className="text-sm font-medium block mb-1.5 text-gray-700 dark:text-gray-300">
              Content
            </label>
            <Textarea 
              id="note-content"
              placeholder="Write your note here..." 
              className="min-h-32 border-gray-200 dark:border-gray-700 resize-none" 
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Search and Sort Controls (Mobile) */}
      <div className="sm:hidden space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white dark:bg-zinc-900"
          />
        </div>
      </div>
      
      {/* Sort Options */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mt-2">
        <Button
          variant="outline"
          size="sm"
          className={sortOrder === 'newest' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/50' : ''}
          onClick={() => setSortOrder('newest')}
        >
          <Clock className="h-4 w-4 mr-1.5" />
          Newest
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={sortOrder === 'oldest' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/50' : ''}
          onClick={() => setSortOrder('oldest')}
        >
          <SortDesc className="h-4 w-4 mr-1.5" />
          Oldest
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={sortOrder === 'alphabetical' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800/50' : ''}
          onClick={() => setSortOrder('alphabetical')}
        >
          <SortDesc className="h-4 w-4 mr-1.5" />
          A-Z
        </Button>
      </div>
      
      {/* Notes Grid */}
      <div>
        {isLoading ? (
          <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading your notes...</p>
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note: Note) => (
              <Card key={note.id} className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/10 dark:to-blue-950/10">
                  <div className="flex justify-between items-start">
                    {editingId === note.id ? (
                      <Input 
                        value={editForm.title} 
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="font-medium border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{note.title}</CardTitle>
                    )}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === note.id ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={saveEdit}
                          disabled={updateNote.isPending}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => startEditing(note)}
                          className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={deleteNote.isPending}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(note.updated_at)}
                    {note.created_at !== note.updated_at && (
                      <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50">
                        edited
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {editingId === note.id ? (
                    <Textarea 
                      value={editForm.content} 
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="min-h-24 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm">{note.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No notes found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm ? 'No notes match your search criteria' : 'Create your first note to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickNotes;
