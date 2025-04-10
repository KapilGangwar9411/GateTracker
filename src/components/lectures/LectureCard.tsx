import React from 'react';
import { Lecture } from '@/types/database.types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Edit, RotateCw, Trash2, AlertCircle, BookOpenCheck, MoreVertical, XCircle, Notebook, Link2, Brain, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTheme } from '@/contexts/ThemeContext';

type LectureCardProps = {
  lecture: Lecture;
  handleToggleComplete: (lectureId: string, completed: boolean) => void;
  handleMarkRevision: (lectureId: string) => void;
  handleDeleteLecture: (lectureId: string) => void;
  handleEditLecture: (lecture: Lecture) => void;
};

const LectureCard = ({
  lecture,
  handleToggleComplete,
  handleMarkRevision,
  handleDeleteLecture,
  handleEditLecture,
}: LectureCardProps) => {
  const { theme } = useTheme();
  if (!lecture || !lecture.id) return null;

  // Get status color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return theme === 'dark' 
          ? 'text-green-400 bg-green-950/40 border-green-800/50' 
          : 'text-green-600 bg-green-100 border-green-200';
      case 'in_progress':
        return theme === 'dark'
          ? 'text-blue-400 bg-blue-950/40 border-blue-800/50'
          : 'text-blue-600 bg-blue-100 border-blue-200';
      case 'needs_revision':
        return theme === 'dark'
          ? 'text-amber-400 bg-amber-950/40 border-amber-800/50'
          : 'text-amber-600 bg-amber-100 border-amber-200';
      case 'not_started':
      default:
        return theme === 'dark'
          ? 'text-slate-400 bg-slate-800/40 border-slate-700/50'
          : 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className={theme === 'dark' ? "h-3.5 w-3.5 text-green-400" : "h-3.5 w-3.5 text-green-600"} />;
      case 'in_progress':
        return <BookOpenCheck className={theme === 'dark' ? "h-3.5 w-3.5 text-blue-400" : "h-3.5 w-3.5 text-blue-600"} />;
      case 'needs_revision':
        return <RotateCw className={theme === 'dark' ? "h-3.5 w-3.5 text-amber-400" : "h-3.5 w-3.5 text-amber-600"} />;
      case 'not_started':
      default:
        return <Clock className={theme === 'dark' ? "h-3.5 w-3.5 text-slate-400" : "h-3.5 w-3.5 text-slate-600"} />;
    }
  };

  // Get status text
  const getStatusText = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'needs_revision':
        return 'Needs Revision';
      case 'not_started':
      default:
        return 'Not Started';
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null, fullDate: boolean = false) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (fullDate) {
      return date.toLocaleDateString();
    } else {
      return date.toLocaleTimeString();
    }
  };

  const handleStatusChange = (status: string) => {
    handleToggleComplete(lecture.id, status === 'completed');
  };

  const handleEdit = () => {
    handleEditLecture(lecture);
  };

  const handleDelete = () => {
    handleDeleteLecture(lecture.id);
  };

  const handleMark = () => {
    handleMarkRevision(lecture.id);
  };

  const handleOpenNotes = () => {
    // Implementation of handleOpenNotes
    console.log('Open notes for lecture:', lecture.id);
  };

  const handleResourceClick = () => {
    // Implementation of handleResourceClick
    console.log('Open resources for lecture:', lecture.id);
  };

  const handleQuizClick = () => {
    // Implementation of handleQuizClick
    console.log('Open practice quiz for lecture:', lecture.id);
  };

  const isLectureCompleted = lecture.completed === true;
  const statusColorClass = getStatusColor(lecture.status);
  const statusText = getStatusText(lecture.status);
  const statusIcon = getStatusIcon(lecture.status);

  // Mock tags - since the Lecture type doesn't include tags
  // In a real application, you would get these from the lecture object
  const lectureTags = ['important', 'review'];

  return (
    <Card
      className={cn(
        "flex flex-col h-full shadow-sm overflow-hidden transition-all hover:shadow-md",
        "border",
        lecture.status && `border-l-4 ${statusColorClass}`
      )}
    >
      {/* Add space for checkbox */}
      <div className="w-6 h-6 absolute top-2 left-2 z-0"></div>
      
      <CardHeader className="p-3 pb-0 flex-shrink-0 pl-9">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{lecture.title}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 -mr-1 -mt-1">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              {!isLectureCompleted && (
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  <span>Mark Complete</span>
                </DropdownMenuItem>
              )}
              {isLectureCompleted && (
                <DropdownMenuItem onClick={() => handleStatusChange('not_started')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  <span>Mark Incomplete</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleMark}>
                <RotateCw className="mr-2 h-4 w-4" />
                <span>Mark Revision</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pl-9 flex-grow space-y-3">
        {/* Subject Badge */}
        {lecture.subject_id && (
          <Badge 
            variant="secondary" 
            className="font-normal text-xs px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary/15"
          >
            {lecture.subjects?.name || lecture.subject_name || lecture.subject_id}
          </Badge>
        )}
        
        {/* Description */}
        <div className="text-sm text-muted-foreground min-h-[2rem] line-clamp-2">
          {lecture.description || <span className={theme === 'dark' ? "italic text-slate-500" : "italic text-slate-400"}>No description provided</span>}
        </div>
        
        {/* Tags */}
        {lectureTags && lectureTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lectureTags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs font-normal rounded-full px-2.5 py-0.5 hover:bg-muted"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Status & Updated Date */}
        <div className="flex items-center justify-between mt-auto">
          <div className={cn(
            "flex items-center text-xs rounded-full px-2 py-0.5",
            statusColorClass
          )}>
            {statusIcon}
            <span className="ml-1 font-medium">{statusText}</span>
          </div>
          
          {lecture.updated_at && (
            <div 
              className="text-xs text-muted-foreground" 
              title={formatDate(lecture.updated_at, true)}
            >
              {formatDate(lecture.updated_at)}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-0 mt-auto border-t">
        <div className="grid grid-cols-3 divide-x w-full">
          {/* Notes Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 rounded-none hover:bg-muted"
            onClick={handleOpenNotes}
          >
            <Notebook className="h-4 w-4 mr-1.5" />
            <span className="text-xs">Notes</span>
          </Button>
          
          {/* Resources Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 rounded-none hover:bg-muted"
            onClick={handleResourceClick}
          >
            <Link2 className="h-4 w-4 mr-1.5" />
            <span className="text-xs">Resources</span>
          </Button>
          
          {/* Quiz Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 rounded-none hover:bg-muted"
            onClick={handleQuizClick}
          >
            <Brain className="h-4 w-4 mr-1.5" />
            <span className="text-xs">Practice</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LectureCard;
