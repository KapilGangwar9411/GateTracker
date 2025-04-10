import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { SubjectOption } from './hooks/lectureTypes';

type SubjectStat = {
  id: string;
  name: string;
  total: number;
  completed: number;
  percentage: number;
};

interface GateSubjectOverviewProps {
  subjects: SubjectOption[];
  subjectStats: SubjectStat[];
  onSelectSubject: (subjectId: string) => void;
}

const GateSubjectsOverview = ({ subjects, subjectStats, onSelectSubject }: GateSubjectOverviewProps) => {
  // Create a map for easy lookup of stats by subject ID
  const statsMap = new Map(subjectStats.map(stat => [stat.id, stat]));
  
  // Group subjects into different categories for GATE CSE
  const subjectGroups = [
    {
      title: "Core Computer Science",
      subjects: subjects.filter(s => 
        ['data-structures', 'algorithms', 'programming', 'toc', 'compiler-design'].includes(s.id)),
    },
    {
      title: "Systems",
      subjects: subjects.filter(s => 
        ['os', 'dbms', 'computer-networks', 'computer-organization', 'digital-logic'].includes(s.id)),
    },
    {
      title: "Mathematics & Aptitude",
      subjects: subjects.filter(s => 
        ['discrete-math', 'engineering-math', 'aptitude'].includes(s.id)),
    },
  ];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">GATE CSE Subject Overview</h2>
      
      {subjectGroups.map((group, index) => (
        <div key={index} className="space-y-3">
          <h3 className="text-lg font-semibold">{group.title}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.subjects.map(subject => {
              const stats = statsMap.get(subject.id);
              const percentage = stats?.percentage || 0;
              const total = stats?.total || 0;
              const completed = stats?.completed || 0;
              
              return (
                <Card key={subject.id} className="overflow-hidden border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <Progress value={percentage} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{completed} / {total} lectures</span>
                        <span>{percentage}% complete</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between mt-2"
                        onClick={() => onSelectSubject(subject.id)}
                      >
                        View Lectures
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="rounded-lg border p-4 bg-muted/30">
        <h3 className="text-lg font-semibold mb-2">Study Tips</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Focus on subjects with lower completion rates</li>
          <li>Aim to complete at least 2-3 lectures per day</li>
          <li>Revise completed lectures regularly to retain information</li>
          <li>Practice with previous year questions after completing a subject</li>
        </ul>
      </div>
    </div>
  );
};

export default GateSubjectsOverview; 