import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lecture } from '@/types/database.types';
import { SubjectOption } from './hooks/lectureTypes';

type EditLectureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lecture: Lecture | null;
  subjects: SubjectOption[];
  setLecture: React.Dispatch<React.SetStateAction<Lecture | null>>;
  handleUpdateLecture: () => void;
  isPending: boolean;
};

const EditLectureDialog = ({
  open,
  onOpenChange,
  lecture,
  subjects,
  setLecture,
  handleUpdateLecture,
  isPending
}: EditLectureDialogProps) => {
  if (!lecture) return null;
  
  const lastUpdated = new Date(lecture.updated_at).toLocaleDateString();
  
  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Edit Lecture</DialogTitle>
        <DialogDescription>
          Update your lecture details and track your GATE preparation progress
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
        <div className="space-y-2">
          <Label htmlFor="edit-title">Lecture Title*</Label>
          <Input 
            id="edit-title" 
            value={lecture.title}
            onChange={(e) => setLecture({ ...lecture, title: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-subject">Subject*</Label>
          <Select 
            value={lecture.subject_id || ''}
            onValueChange={(value) => setLecture({ ...lecture, subject_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="completed"
            checked={lecture.completed}
            onCheckedChange={(checked) => {
              const isCompleted = !!checked;
              setLecture({
                ...lecture,
                completed: isCompleted,
                status: isCompleted ? 'completed' : 'in_progress'
              });
            }}
          />
          <Label htmlFor="completed">Mark as completed</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea 
            id="edit-description" 
            value={lecture.description || ''}
            onChange={(e) => setLecture({ ...lecture, description: e.target.value })}
            className="min-h-24"
            placeholder="Enter lecture notes, important points, or topics covered"
          />
          <p className="text-xs text-muted-foreground">
            Add details like important formulas, concepts, or notes for revision
          </p>
        </div>
        
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Lecture Progress</h4>
            <Badge variant={lecture.completed ? "default" : "outline"} className={lecture.completed ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}>
              {lecture.completed ? "Completed" : "In Progress"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This lecture {lecture.completed ? "has been marked as completed" : "is still in progress"}. 
            Remember to mark it as revised regularly during your GATE preparation.
          </p>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpdateLecture} 
          disabled={isPending || !lecture.title || !lecture.subject_id}
        >
          {isPending ? 'Updating...' : 'Update Lecture'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default EditLectureDialog;
