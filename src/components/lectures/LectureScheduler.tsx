import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Lecture } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarClock, CheckCircle, Clock, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Type definition for scheduled lecture
type ScheduledLecture = {
  id: string;
  lectureId: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  completed: boolean;
  subject: string;
};

interface LectureSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lectures?: Lecture[];
  fullPage?: boolean;
}

const LectureScheduler = ({ open, onOpenChange, lectures = [], fullPage = false }: LectureSchedulerProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedLecture, setSelectedLecture] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:30');

  // Demo scheduled lectures
  const [scheduledLectures, setScheduledLectures] = useState<ScheduledLecture[]>([
    {
      id: '1',
      lectureId: 'lec1',
      title: 'Data Structures - Arrays',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:30',
      completed: false,
      subject: 'Data Structures'
    },
    {
      id: '2',
      lectureId: 'lec2',
      title: 'Algorithms - Sorting',
      date: new Date(),
      startTime: '13:00',
      endTime: '14:30',
      completed: true,
      subject: 'Algorithms'
    }
  ]);

  // Filter lectures for the selected date
  const lecturesForSelectedDate = scheduledLectures.filter(
    lecture => date && lecture.date.toDateString() === date.toDateString()
  );

  const toggleComplete = (id: string) => {
    setScheduledLectures(
      scheduledLectures.map(lecture => 
        lecture.id === id 
        ? { ...lecture, completed: !lecture.completed } 
        : lecture
      )
    );
  };

  const handleScheduleLecture = () => {
    if (!date || !selectedLecture || !startTime || !endTime) {
      alert('Please fill in all fields');
      return;
    }

    const selectedLectureObj = lectures.find(l => l.id === selectedLecture);
    if (!selectedLectureObj) return;

    const newScheduledLecture: ScheduledLecture = {
      id: `scheduled-${Date.now()}`,
      lectureId: selectedLecture,
      title: selectedLectureObj.title,
      date: date,
      startTime,
      endTime,
      completed: false,
      subject: selectedLectureObj.subject_name || 'N/A'
    };

    setScheduledLectures([...scheduledLectures, newScheduledLecture]);
    setSelectedLecture('');
  };

  // This holds the content to be displayed
  const content = (
    <div className={`grid grid-cols-1 ${fullPage ? "md:grid-cols-[400px_1fr]" : "md:grid-cols-[300px_1fr]"} gap-4 ${fullPage ? "" : "mt-4"}`}>
      <div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="border rounded-md"
        />
      </div>

      <div className="flex flex-col space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <CalendarClock className="h-4 w-4 mr-2" />
              {date ? date.toDateString() : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lecturesForSelectedDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lectures scheduled for this day</p>
            ) : (
              <ScrollArea className={fullPage ? "h-[400px]" : "h-[300px]"}>
                <div className="space-y-3">
                  {lecturesForSelectedDate.map(lecture => (
                    <Card key={lecture.id} className="border">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium">{lecture.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {lecture.subject}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {lecture.startTime} - {lecture.endTime}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant={lecture.completed ? "default" : "outline"} 
                            size="sm"
                            onClick={() => toggleComplete(lecture.id)}
                            className="h-7 px-2"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            {lecture.completed ? 'Completed' : 'Mark Complete'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startTime">Start Time</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endTime">End Time</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lecture">Lecture</Label>
              <Select value={selectedLecture} onValueChange={setSelectedLecture}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lecture" />
                </SelectTrigger>
                <SelectContent>
                  {lectures.length > 0 ? (
                    lectures.map(lecture => (
                      <SelectItem key={lecture.id} value={lecture.id}>
                        {lecture.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-lectures" disabled>
                      No lectures available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleScheduleLecture}>
              <Plus className="h-4 w-4 mr-1" /> 
              Schedule Lecture
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // For full page view, return the content directly
  if (fullPage) {
    return content;
  }

  // For dialog view, wrap content in DialogContent
  return (
    <DialogContent className="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>Lecture Scheduler</DialogTitle>
      </DialogHeader>
      {content}
    </DialogContent>
  );
};

export default LectureScheduler; 