import React, { useMemo, useState } from 'react';
import LectureCard from './LectureCard';
import { Lecture } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, RotateCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type LectureListProps = {
  lectures: Lecture[];
  loadingLectures: boolean;
  handleToggleComplete: (id: string, completed: boolean) => void;
  handleEditLecture: (lecture: Lecture) => void;
  handleDeleteLecture: (id: string) => void;
  handleMarkRevision: (id: string) => void;
  viewType?: 'grid' | 'list';
};

type GroupedLectures = {
  [subjectId: string]: {
    subjectName: string;
    lectures: Lecture[];
  }
};

const LectureList = ({
  lectures,
  loadingLectures,
  handleToggleComplete,
  handleEditLecture,
  handleDeleteLecture,
  handleMarkRevision,
  viewType = 'grid'
}: LectureListProps) => {
  // State for selected lectures (batch operations)
  const [selectedLectures, setSelectedLectures] = useState<string[]>([]);
  // State for expanded subject groups
  const [expandedSubjects, setExpandedSubjects] = useState<{ [key: string]: boolean }>({});

  // Group lectures by subject
  const groupedLectures = useMemo(() => {
    const grouped: GroupedLectures = {};
    
    lectures.forEach(lecture => {
      if (!lecture || !lecture.id || !lecture.title) return;
      
      const subjectId = lecture.subject_id || 'uncategorized';
      const subjectName = lecture.subject_name || 'Uncategorized';
      
      if (!grouped[subjectId]) {
        grouped[subjectId] = {
          subjectName,
          lectures: []
        };
        // Auto-expand all subject groups initially
        if (expandedSubjects[subjectId] === undefined) {
          setExpandedSubjects(prev => ({...prev, [subjectId]: true}));
        }
      }
      
      grouped[subjectId].lectures.push(lecture);
    });
    
    return grouped;
  }, [lectures, expandedSubjects]);

  // Toggle subject expansion
  const toggleSubjectExpansion = (subjectId: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  // Toggle a lecture selection
  const toggleLectureSelection = (lectureId: string) => {
    setSelectedLectures(prevSelected => {
      if (prevSelected.includes(lectureId)) {
        return prevSelected.filter(id => id !== lectureId);
      } else {
        return [...prevSelected, lectureId];
      }
    });
  };

  // Select all lectures in a subject
  const selectAllInSubject = (subjectId: string) => {
    const subjectLectures = groupedLectures[subjectId]?.lectures || [];
    const subjectLectureIds = subjectLectures.map(lecture => lecture.id);
    
    setSelectedLectures(prev => {
      // Check if all lectures in this subject are already selected
      const allAlreadySelected = subjectLectureIds.every(id => prev.includes(id));
      
      if (allAlreadySelected) {
        // Deselect all lectures in this subject
        return prev.filter(id => !subjectLectureIds.includes(id));
      } else {
        // Add all lectures in this subject that aren't already selected
        const newSelectedIds = subjectLectureIds.filter(id => !prev.includes(id));
        return [...prev, ...newSelectedIds];
      }
    });
  };

  // Batch mark complete
  const batchMarkComplete = () => {
    selectedLectures.forEach(id => {
      const lecture = lectures.find(l => l.id === id);
      if (lecture && !lecture.completed) {
        handleToggleComplete(id, lecture.completed);
      }
    });
    setSelectedLectures([]);
  };

  // Batch mark revised
  const batchMarkRevised = () => {
    selectedLectures.forEach(id => {
      handleMarkRevision(id);
    });
    setSelectedLectures([]);
  };

  if (loadingLectures) {
    return <div className="col-span-full text-center py-8">Loading lectures...</div>;
  }

  if (!lectures || !Array.isArray(lectures) || lectures.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        No lectures found. Try adding a new lecture.
      </div>
    );
  }

  // Get valid lectures count
  const validLecturesCount = Object.values(groupedLectures).reduce(
    (count, group) => count + group.lectures.length, 0
  );
  
  if (validLecturesCount === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        No valid lectures found. Try adding a new lecture.
      </div>
    );
  }

  return (
    <div className="col-span-full space-y-4">
      {/* Show batch actions when lectures are selected */}
      {selectedLectures.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-md p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="text-sm">
            <span className="font-medium">{selectedLectures.length}</span> lecture{selectedLectures.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" variant="outline" onClick={batchMarkComplete} className="flex-1 sm:flex-none">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Mark Completed</span>
              <span className="sm:hidden">Complete</span>
            </Button>
            <Button size="sm" variant="outline" onClick={batchMarkRevised} className="flex-1 sm:flex-none">
              <RotateCw className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Mark Revised</span>
              <span className="sm:hidden">Revised</span>
            </Button>
          </div>
        </div>
      )}

      {/* Display lectures grouped by subject */}
      {Object.entries(groupedLectures).map(([subjectId, { subjectName, lectures }]) => (
        <div key={subjectId} className="border rounded-md overflow-hidden">
          {/* Subject header with toggle */}
          <div 
            className="flex items-center justify-between p-2 sm:p-3 bg-muted cursor-pointer" 
            onClick={() => toggleSubjectExpansion(subjectId)}
          >
            <div className="flex items-center gap-2 text-sm sm:text-base">
              {expandedSubjects[subjectId] ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
              <h3 className="font-medium truncate max-w-[150px] sm:max-w-none">{subjectName}</h3>
              <Badge variant="outline" className="ml-1 sm:ml-2 text-xs">
                {lectures.length} <span className="hidden xs:inline">lecture{lectures.length !== 1 ? 's' : ''}</span>
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2" onClick={e => e.stopPropagation()}>
              <Checkbox 
                id={`select-all-${subjectId}`}
                checked={lectures.length > 0 && lectures.every(l => selectedLectures.includes(l.id))}
                onCheckedChange={() => selectAllInSubject(subjectId)}
              />
              <label 
                htmlFor={`select-all-${subjectId}`}
                className="text-xs sm:text-sm whitespace-nowrap"
                onClick={() => selectAllInSubject(subjectId)}
              >
                Select all
              </label>
            </div>
          </div>
          
          {/* Subject lectures */}
          {expandedSubjects[subjectId] && (
            <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              {lectures.map(lecture => (
                <div key={lecture.id} className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox 
                      id={`lecture-${lecture.id}`}
                      checked={selectedLectures.includes(lecture.id)}
                      onCheckedChange={() => toggleLectureSelection(lecture.id)}
                    />
                  </div>
                  <LectureCard
                    lecture={lecture}
                    handleToggleComplete={handleToggleComplete}
                    handleEditLecture={handleEditLecture}
                    handleDeleteLecture={handleDeleteLecture}
                    handleMarkRevision={handleMarkRevision}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LectureList;
