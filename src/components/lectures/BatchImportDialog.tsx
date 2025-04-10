import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SubjectOption } from './hooks/lectureTypes';

interface BatchLecture {
  title: string;
  description?: string;
  completed?: boolean;
}

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: SubjectOption[];
}

const BatchImportDialog = ({ open, onOpenChange, subjects }: BatchImportDialogProps) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [importText, setImportText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImport = () => {
    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }

    if (!importText.trim()) {
      toast.error('Please enter lecture titles to import');
      return;
    }

    try {
      setIsSubmitting(true);
      // Process the import text - normally you would parse this and create lectures
      
      // Mock successful import
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success('Lectures imported successfully');
        onOpenChange(false);
        setImportText('');
        setSelectedSubjectId('');
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Failed to import lectures');
    }
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Batch Import Lectures</DialogTitle>
        <DialogDescription>
          Import multiple lectures at once by entering one lecture per line.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="importText">Lectures (one per line)</Label>
          <Textarea
            id="importText"
            placeholder="Lecture 1&#10;Lecture 2&#10;Lecture 3"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Format: "Title | Description | Completed (true/false)" (description and completed status are optional)
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" onClick={handleImport} disabled={isSubmitting}>
          {isSubmitting ? 'Importing...' : 'Import Lectures'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default BatchImportDialog; 