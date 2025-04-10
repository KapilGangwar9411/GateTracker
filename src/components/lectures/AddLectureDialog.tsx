import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SubjectOption } from './hooks/lectureTypes';

type AddLectureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newLecture: {
    title: string;
    description: string;
    subject_id: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
  };
  subjects: SubjectOption[];
  setNewLecture: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    subject_id: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
  }>>;
  handleCreateLecture: () => void;
  isPending: boolean;
};

const AddLectureDialog = ({
  open,
  onOpenChange,
  newLecture,
  subjects,
  setNewLecture,
  handleCreateLecture,
  isPending
}: AddLectureDialogProps) => {
  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Add New Lecture</DialogTitle>
        <DialogDescription>
          Create a new lecture to track your GATE preparation progress
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
        <div className="space-y-2">
          <Label htmlFor="title">Lecture Title*</Label>
          <Input 
            id="title" 
            placeholder="e.g. Computer Networks: TCP/IP Protocol"
            value={newLecture.title}
            onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subject">Subject*</Label>
          <Select 
            value={newLecture.subject_id}
            onValueChange={(value) => setNewLecture({ ...newLecture, subject_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.length === 0 ? (
                <SelectItem value="no-subjects" disabled>
                  No subjects available. Please add subjects first.
                </SelectItem>
              ) : (
                subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Assign this lecture to a subject area</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="completed"
            checked={newLecture.status === 'completed'}
            onCheckedChange={(checked) => {
              setNewLecture({
                ...newLecture,
                status: checked ? 'completed' : 'not_started'
              });
            }}
          />
          <Label htmlFor="completed">Mark as completed</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            placeholder="Enter lecture notes, important points, or topics covered"
            value={newLecture.description}
            onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
            className="min-h-24"
          />
          <p className="text-xs text-muted-foreground">
            Add details like important formulas, concepts, or notes for revision
          </p>
        </div>

        <div className="pt-2 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Tips for GATE Preparation:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Regularly mark lectures as "revised" after each revision session</li>
            <li>Add detailed notes to help with quick revision before exams</li>
            <li>Track your progress to ensure complete syllabus coverage</li>
          </ul>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleCreateLecture} disabled={isPending || !newLecture.title || !newLecture.subject_id}>
          {isPending ? 'Creating...' : 'Create Lecture'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default AddLectureDialog;
