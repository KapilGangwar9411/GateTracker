import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lecture } from '@/types/database.types';

// Define the types we need
type SubjectOption = {
  id: string;
  name: string;
};

type LectureAnalyticsProps = {
  lectures: Lecture[];
  subjects: SubjectOption[];
};

const LectureAnalytics = ({ lectures, subjects }: LectureAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState('month');
  const [chartType, setChartType] = useState('progress');
  
  // Calculate basic stats
  const totalLectures = lectures.length;
  const completedLectures = lectures.filter(l => l.completed).length;
  const incompleteLectures = totalLectures - completedLectures;
  const completionPercentage = totalLectures > 0 
    ? Math.round((completedLectures / totalLectures) * 100)
    : 0;
  
  // Group lectures by subject
  const lecturesBySubject = subjects.map(subject => {
    const subjectLectures = lectures.filter(lecture => lecture.subject_id === subject.id);
    const completed = subjectLectures.filter(lecture => lecture.completed).length;
    const total = subjectLectures.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      id: subject.id,
      name: subject.name,
      total,
      completed,
      percentage
    };
  }).filter(subject => subject.total > 0).sort((a, b) => b.total - a.total);
  
  // Group lectures by status
  const lecturesByStatus = [
    {
      status: 'completed',
      count: lectures.filter(l => l.status === 'completed').length,
      color: 'bg-green-500'
    },
    {
      status: 'in_progress',
      count: lectures.filter(l => l.status === 'in_progress').length,
      color: 'bg-blue-500'
    },
    {
      status: 'needs_revision',
      count: lectures.filter(l => l.status === 'needs_revision').length,
      color: 'bg-amber-500'
    },
    {
      status: 'not_started',
      count: lectures.filter(l => l.status === 'not_started').length,
      color: 'bg-gray-300'
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold">Analytics & Insights</h2>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Lectures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLectures}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {lecturesBySubject.length} subjects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedLectures}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {incompleteLectures} lectures remaining
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lectures completed per day
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium">Progress Analytics</CardTitle>
          <Tabs value={chartType} onValueChange={setChartType} className="w-auto">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="progress" className="text-xs px-2">
                <BarChart className="h-3.5 w-3.5 mr-1" />
                Progress
              </TabsTrigger>
              <TabsTrigger value="trend" className="text-xs px-2">
                <LineChart className="h-3.5 w-3.5 mr-1" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="distribution" className="text-xs px-2">
                <PieChart className="h-3.5 w-3.5 mr-1" />
                Distribution
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="progress" className="mt-0">
            <div className="space-y-4">
              {lecturesBySubject.slice(0, 5).map(subject => (
                <div key={subject.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{subject.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {subject.completed}/{subject.total}
                    </span>
                  </div>
                  <Progress value={subject.percentage} className="h-2" />
                </div>
              ))}
              
              {lecturesBySubject.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {lecturesBySubject.length - 5} more subjects
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="trend" className="mt-0">
            <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-lg">
              <div className="text-center">
                <p className="text-muted-foreground">Completion trend over time chart</p>
                <p className="text-xs text-muted-foreground">(Placeholder for actual chart)</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution" className="mt-0">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {lecturesByStatus.map(item => (
                  <Badge key={item.status} variant="outline" className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${item.color}`}></div>
                    <span className="capitalize">{item.status.replace('_', ' ')}</span>
                    <span className="ml-1 font-semibold">{item.count}</span>
                  </Badge>
                ))}
              </div>
              
              <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground">Status distribution chart</p>
                  <p className="text-xs text-muted-foreground">(Placeholder for actual chart)</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md p-3 bg-amber-50">
              <h4 className="font-medium text-amber-800">Focus Areas</h4>
              <p className="text-sm text-amber-700 mt-1">
                Consider focusing on "Data Structures" and "Algorithms" where your completion rates are below 30%.
              </p>
            </div>
            
            <div className="border rounded-md p-3 bg-blue-50">
              <h4 className="font-medium text-blue-800">Revision Needed</h4>
              <p className="text-sm text-blue-700 mt-1">
                5 lectures are due for revision based on your spaced repetition schedule.
              </p>
            </div>
            
            <div className="border rounded-md p-3 bg-green-50">
              <h4 className="font-medium text-green-800">On Track</h4>
              <p className="text-sm text-green-700 mt-1">
                You're making good progress in "Operating Systems" with 75% completion rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LectureAnalytics; 