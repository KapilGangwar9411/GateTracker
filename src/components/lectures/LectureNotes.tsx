import React, { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lecture } from '@/types/database.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, Save, FileText, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNotes, Note } from './hooks/useNotes';
import { formatDistanceToNow } from 'date-fns';
import { PlusIcon, TrashIcon, PencilIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Types
type LectureNotesProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  fullPage?: boolean;
};

const Spinner = ({ size = "md", className = "" }) => {
  return <Loader2 className={`animate-spin ${size === "sm" ? "h-4 w-4" : "h-6 w-6"} ${className}`} />;
};

export function LectureNotes({ 
  open = true, 
  onOpenChange = () => {}, 
  fullPage = false 
}: LectureNotesProps) {
  const { notes, isLoading, saveNote, deleteNote } = useNotes();
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const selectedNote = selectedNoteId 
    ? notes.find(note => note.id === selectedNoteId) 
    : null;
  
  useEffect(() => {
    if (selectedNote) {
      setContent(selectedNote.content);
    }
  }, [selectedNote]);
  
  const handleNewNote = () => {
    setSelectedNoteId(null);
    setContent('');
  };
  
  const handleSaveNote = async () => {
    if (!content.trim()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      await saveNote.mutateAsync({
        id: selectedNoteId || undefined,
        content,
      });
      
      if (!selectedNoteId) {
        handleNewNote(); // Reset form after creating a new note
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote.mutateAsync(selectedNoteId);
      handleNewNote();
    }
  };
  
  if (!open) return null;

  return (
    <div className={`flex flex-col ${fullPage ? 'h-full' : 'h-[600px]'}`}>
      <div className="flex flex-col md:flex-row h-full gap-4">
        {/* Notes List */}
        <Card className="md:w-80 flex-shrink-0">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleNewNote}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Note
                </Button>
                
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Spinner />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notes.map(note => (
                      <Button 
                        key={note.id}
                        variant={selectedNoteId === note.id ? "default" : "ghost"} 
                        className="w-full justify-start overflow-hidden"
                        onClick={() => setSelectedNoteId(note.id)}
                      >
                        <div className="truncate text-left w-full">
                          <div className="font-medium truncate">Note</div>
                          <div className="text-xs opacity-70 truncate">
                            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Note Editor */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>
              {selectedNoteId ? 'Edit Note' : 'New Note'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your notes here..."
                className="min-h-[200px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {selectedNoteId && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteNote} 
                disabled={isSaving || deleteNote.isPending}
              >
                {deleteNote.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNewNote}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveNote} 
                disabled={isSaving || !content || saveNote.isPending}
              >
                {saveNote.isPending || isSaving ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <PencilIcon className="h-4 w-4 mr-2" />
                )}
                Save Note
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default LectureNotes; 