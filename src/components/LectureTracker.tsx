import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PlusCircle, 
  Search, 
  FilterX, 
  LayoutGrid, 
  List, 
  Upload, 
  Download,
  Layers, 
  BookPlus,
  Calendar,
  LineChart,
  Clock,
  FileText,
  Tag,
  CheckSquare
} from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLectures } from './lectures/hooks/useLectures';
import AddLectureDialog from './lectures/AddLectureDialog';
import EditLectureDialog from './lectures/EditLectureDialog';
import LectureList from './lectures/LectureList';
import BatchImportDialog from './lectures/BatchImportDialog';
import SubjectTemplateDialog from './lectures/SubjectTemplateDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lecture, Subject } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LectureScheduler from './lectures/LectureScheduler';
import LectureNotes from './lectures/LectureNotes';
import GateSubjectsOverview from './lectures/GateSubjectsOverview';
import LectureAnalytics from './lectures/LectureAnalytics';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define GATE CSE subjects
const GATE_SUBJECTS = [
  { id: 'data-structures', name: 'Data Structures & Algorithms' },
  { id: 'algorithms', name: 'Algorithm Design & Analysis' },
  { id: 'programming', name: 'Programming & Data Structures' },
  { id: 'toc', name: 'Theory of Computation' },
  { id: 'compiler-design', name: 'Compiler Design' },
  { id: 'os', name: 'Operating Systems' },
  { id: 'dbms', name: 'Database Management Systems' },
  { id: 'computer-networks', name: 'Computer Networks' },
  { id: 'computer-organization', name: 'Computer Organization & Architecture' },
  { id: 'digital-logic', name: 'Digital Logic' },
  { id: 'discrete-math', name: 'Discrete Mathematics' },
  { id: 'engineering-math', name: 'Engineering Mathematics' },
  { id: 'aptitude', name: 'General Aptitude' },
];

const LectureTracker = () => {
  const {
    lectures,
    loadingLectures,
    subjects,
    open,
    setOpen,
    editOpen,
    setEditOpen,
    currentLecture,
    setCurrentLecture,
    newLecture,
    setNewLecture,
    handleCreateLecture,
    handleUpdateLecture,
    handleEditLecture,
    handleDeleteLecture,
    handleToggleComplete,
    handleMarkRevision,
    createLecture,
    updateLecture
  } = useLectures();

  // Dialog states for new batch operations
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  
  // View type
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('lectures');

  // Stats
  const totalLectures = lectures.length;
  const completedLectures = lectures.filter(l => l.completed).length;
  const incompleteLectures = totalLectures - completedLectures;
  const completionPercentage = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  // Subject stats
  const subjectStats = React.useMemo(() => {
    const stats: {[key: string]: {total: number, completed: number, name: string}} = {};
    
    lectures.forEach(lecture => {
      const subjectId = lecture.subject_id || 'uncategorized';
      const subjectName = lecture.subject_name || 'Uncategorized';
      
      if (!stats[subjectId]) {
        stats[subjectId] = {
          total: 0,
          completed: 0,
          name: subjectName
        };
      }
      
      stats[subjectId].total += 1;
      if (lecture.completed) {
        stats[subjectId].completed += 1;
      }
    });
    
    return Object.entries(stats).map(([id, data]) => ({
      id,
      name: data.name,
      total: data.total,
      completed: data.completed,
      percentage: Math.round((data.completed / data.total) * 100)
    })).sort((a, b) => b.total - a.total);
  }, [lectures]);


  const topicsForCurrentSubject = React.useMemo(() => {
    return [
      { id: 'topic1', name: 'Basic Concepts' },
      { id: 'topic2', name: 'Advanced Topics' },
      { id: 'topic3', name: 'Practice Problems' },
      { id: 'topic4', name: 'Previous Year Questions' },
    ];
  }, [subjectFilter]);


  const availableTags = React.useMemo(() => [
    'important', 'review', 'difficult', 'easy', 'must-do', 'concept', 'numericals'
  ], []);


  const filteredLectures = lectures.filter(lecture => {
 
    const matchesSearch = !searchQuery || 
      lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (lecture.description && lecture.description.toLowerCase().includes(searchQuery.toLowerCase()));
    

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && lecture.completed) || 
      (statusFilter === 'incomplete' && !lecture.completed);
    
  
    const matchesSubject = 
      subjectFilter === 'all' || 
      lecture.subject_id === subjectFilter;
    
   
    const matchesTopic = topicFilter === 'all';
    

    const matchesTag = !tagFilter;
    
   
    return matchesSearch && matchesStatus && matchesSubject && matchesTopic && matchesTag;
  });


  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSubjectFilter('all');
    setTopicFilter('all');
    setTagFilter('');
  };

  // Quick filter by subject
  const filterBySubject = (subjectId: string) => {
    setSubjectFilter(subjectId);
  };

  // Switch to lectures tab
  const switchToLecturesTab = () => {
    const lecturesTab = document.querySelector('[data-value="lectures"]') as HTMLElement;
    if (lecturesTab) {
      lecturesTab.click();
    }
  };

  // Export lectures to JSON
  const exportLectures = () => {
    const lecturesData = subjectFilter === 'all' 
      ? lectures 
      : lectures.filter(l => l.subject_id === subjectFilter);
    
    const dataStr = JSON.stringify(lecturesData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `gate-lectures-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lectures" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">GATE Overview</TabsTrigger>
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {/* GATE Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-background border rounded-lg p-4 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">GATE CSE Subjects Overview</h2>
              <GateSubjectsOverview subjects={GATE_SUBJECTS} subjectStats={subjectStats} onSelectSubject={filterBySubject} />
            </div>
          </TabsContent>

          {/* Lectures Tab Content */}
          <TabsContent value="lectures" className="space-y-6">
            {/* Header with stats */}
            <div className="bg-background border rounded-lg p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold">GATE Lectures</h2>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <div className="flex rounded-md overflow-hidden border">
                    <Button
                      variant={viewType === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-none px-2 sm:px-3"
                      onClick={() => setViewType('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1">Grid</span>
                    </Button>
                    <Button
                      variant={viewType === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-none px-2 sm:px-3"
                      onClick={() => setViewType('list')}
                    >
                      <List className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1">List</span>
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {/* Single Lecture Add Button */}
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">
                          <PlusCircle className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Add Lecture</span>
                        </Button>
                      </DialogTrigger>

                      <AddLectureDialog
                        open={open}
                        onOpenChange={setOpen}
                        newLecture={newLecture}
                        subjects={subjects}
                        setNewLecture={setNewLecture}
                        handleCreateLecture={handleCreateLecture}
                        isPending={createLecture.isPending}
                      />
                    </Dialog>
                    
                    {/* Batch Import Button */}
                    <Dialog open={batchImportOpen} onOpenChange={setBatchImportOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">
                          <Upload className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Batch Import</span>
                        </Button>
                      </DialogTrigger>
                      
                      <BatchImportDialog 
                        open={batchImportOpen}
                        onOpenChange={setBatchImportOpen}
                        subjects={subjects}
                      />
                    </Dialog>
                    
                    {/* Subject Template Button */}
                    <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">
                          <BookPlus className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Use Template</span>
                        </Button>
                      </DialogTrigger>
                      
                      <SubjectTemplateDialog
                        open={templateOpen}
                        onOpenChange={setTemplateOpen}
                        subjects={subjects as unknown as Subject[]}
                      />
                    </Dialog>
                    
                    {/* Mobile actions dropdown */}
                    <div className="block sm:hidden">
                      <Select>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="More" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="schedule" onSelect={() => setSchedulerOpen(true)}>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>Schedule</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="notes" onSelect={() => setNotesOpen(true)}>
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Notes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="export" onSelect={exportLectures}>
                            <div className="flex items-center">
                              <Download className="mr-2 h-4 w-4" />
                              <span>Export</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Desktop actions */}
                    <div className="hidden sm:flex sm:gap-2">
                      {/* Schedule Button */}
                      <Dialog open={schedulerOpen} onOpenChange={setSchedulerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="shrink-0">
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                          </Button>
                        </DialogTrigger>
                        
                        <LectureScheduler
                          open={schedulerOpen}
                          onOpenChange={setSchedulerOpen}
                          lectures={filteredLectures}
                        />
                      </Dialog>
                      
                      {/* Notes Button */}
                      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="shrink-0">
                            <FileText className="mr-2 h-4 w-4" />
                            Notes
                          </Button>
                        </DialogTrigger>
                        
                        <LectureNotes
                          open={notesOpen}
                          onOpenChange={setNotesOpen}
                          lectures={filteredLectures}
                        />
                      </Dialog>
                      
                      {/* Export Button */}
                      <Button variant="outline" size="sm" onClick={exportLectures}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Overall Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={completionPercentage} className="h-3 mb-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{completedLectures} completed</span>
                      <span>{completionPercentage}%</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Today's Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="font-medium">5 lectures scheduled</p>
                        <p className="text-sm text-muted-foreground">3 hours planned</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('scheduler')}>
                      View
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Focus Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {subjectStats.slice(0, 3).map((subject) => (
                        <div key={subject.id} className="flex justify-between items-center text-sm">
                          <span>{subject.name}</span>
                          <Badge variant={subject.percentage < 50 ? "destructive" : "outline"}>
                            {subject.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Filters */}
              <div className="border rounded-lg p-3 space-y-3 mb-6 bg-muted/30">
                <div className="flex flex-col gap-3">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search lectures..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={topicFilter} onValueChange={setTopicFilter}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Select Topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topicsForCurrentSubject.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'completed' | 'incomplete')}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-10"
                    >
                      <FilterX className="h-4 w-4 mr-1" />
                      <span>Clear</span>
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  <span className="text-sm text-muted-foreground mr-2">Tags:</span>
                  <ScrollArea className="w-full h-8 whitespace-nowrap">
                    <div className="flex gap-2">
                      {availableTags.map(tag => (
                        <Badge 
                          key={tag}
                          variant={tagFilter === tag ? "default" : "outline"}
                          className="cursor-pointer whitespace-nowrap text-xs"
                          onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
            
            {/* Lecture List */}
            <div className="bg-background border rounded-lg p-4 shadow-sm">
              {loadingLectures ? (
                <div className="p-6 text-center">Loading lectures...</div>
              ) : (
                <>
                  {/* Show lecture count */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      {filteredLectures.length} Lecture{filteredLectures.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Viewing {filteredLectures.length} of {totalLectures} lectures
                      </span>
                    </div>
                  </div>
                  
                  {/* Lecture grid/list */}
                  <LectureList
                    lectures={filteredLectures}
                    loadingLectures={loadingLectures}
                    handleToggleComplete={handleToggleComplete}
                    handleEditLecture={handleEditLecture}
                    handleDeleteLecture={handleDeleteLecture}
                    handleMarkRevision={handleMarkRevision}
                    viewType={viewType}
                  />
                </>
              )}
            </div>
          </TabsContent>
          
          {/* Scheduler Tab Content */}
          <TabsContent value="scheduler" className="space-y-6">
            <div className="bg-background border rounded-lg p-4 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Study Scheduler</h2>
              <LectureScheduler
                open={schedulerOpen}
                onOpenChange={setSchedulerOpen}
                lectures={lectures}
                fullPage={true}
              />
            </div>
          </TabsContent>
          
          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-background border rounded-lg p-4 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Study Analytics</h2>
              <LectureAnalytics 
                lectures={lectures}
                subjects={subjects}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Edit Lecture Dialog */}
      <EditLectureDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lecture={currentLecture}
        subjects={subjects}
        setLecture={setCurrentLecture}
        handleUpdateLecture={handleUpdateLecture}
        isPending={updateLecture.isPending}
      />
    </div>
  );
};

export default LectureTracker;
