import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, BookOpen, Layers, CheckCircle, AlertCircle, Bookmark, BarChart4, Search, BookMarked, GraduationCap, Award, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Define interfaces for type safety
interface Lecture {
  id: string;
  title?: string;
  subject_id?: string;
  subject_name?: string;
  completed: boolean;
}

// Hardcoded GATE CSE subjects with updated data
const GATE_SUBJECTS = [
  { id: 'data-structures', name: 'Data Structures & Algorithms', color: 'from-blue-500 to-blue-600', icon: Layers, total_topics: 15, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'algorithms', name: 'Algorithm Design & Analysis', color: 'from-green-500 to-green-600', icon: BookOpen, total_topics: 12, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'programming', name: 'Programming & Data Structures', color: 'from-purple-500 to-purple-600', icon: BookOpen, total_topics: 10, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'toc', name: 'Theory of Computation', color: 'from-amber-500 to-amber-600', icon: Brain, total_topics: 8, completed_topics: 0, importance: 'medium', category: 'theory' },
  { id: 'compiler-design', name: 'Compiler Design', color: 'from-rose-500 to-rose-600', icon: BookOpen, total_topics: 10, completed_topics: 0, importance: 'medium', category: 'advanced' },
  { id: 'os', name: 'Operating Systems', color: 'from-teal-500 to-teal-600', icon: BookOpen, total_topics: 14, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'dbms', name: 'Database Management Systems', color: 'from-indigo-500 to-indigo-600', icon: BookOpen, total_topics: 12, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'computer-networks', name: 'Computer Networks', color: 'from-pink-500 to-pink-600', icon: BookOpen, total_topics: 12, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'computer-organization', name: 'Computer Organization & Architecture', color: 'from-blue-500 to-blue-600', icon: BookOpen, total_topics: 15, completed_topics: 0, importance: 'medium', category: 'advanced' },
  { id: 'digital-logic', name: 'Digital Logic', color: 'from-green-500 to-green-600', icon: BookOpen, total_topics: 8, completed_topics: 0, importance: 'medium', category: 'core' },
  { id: 'discrete-math', name: 'Discrete Mathematics', color: 'from-purple-500 to-purple-600', icon: BookMarked, total_topics: 10, completed_topics: 0, importance: 'medium', category: 'mathematics' },
  { id: 'engineering-math', name: 'Engineering Mathematics', color: 'from-amber-500 to-amber-600', icon: BookMarked, total_topics: 12, completed_topics: 0, importance: 'high', category: 'mathematics' },
  { id: 'aptitude', name: 'General Aptitude', color: 'from-rose-500 to-rose-600', icon: GraduationCap, total_topics: 6, completed_topics: 0, importance: 'medium', category: 'general' }
];

const SubjectTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjectStats, setSubjectStats] = useState<Record<string, {total: number, completed: number}>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [view, setView] = useState('grid');
  
  // Fetch all lectures
  const { data: lectures = [], isLoading } = useQuery({
    queryKey: ['all-lectures'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('lectures')
          .select('*');
        
        if (error) {
          toast.error('Error loading lectures', { description: error.message });
          throw error;
        }
        
        return data || [];
      } catch (err) {
        console.error('Error fetching lectures:', err);
        return [];
      }
    },
    enabled: !!user
  });
  
  // Calculate overall progress
  const overallProgress = () => {
    let total = 0;
    let completed = 0;
    
    Object.values(subjectStats).forEach(stat => {
      total += stat.total;
      completed += stat.completed;
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  // Set up real-time subscription for lectures
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('lectures-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lectures' },
        (payload) => {
          console.log('Change received!', payload);
          // The useQuery hooks will automatically refetch after changes
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  // Calculate stats for all subjects when lectures change
  useEffect(() => {
    if (!lectures || !lectures.length) return;
    
    const stats: Record<string, {total: number, completed: number}> = {};
    
    // Initialize stats for all subjects
    GATE_SUBJECTS.forEach(subject => {
      stats[subject.id] = { total: 0, completed: 0 };
    });
    
    // Process lectures
    lectures.forEach((lecture: Lecture) => {
      // Try to match with subject_id directly
      if (lecture.subject_id && stats[lecture.subject_id]) {
        stats[lecture.subject_id].total++;
        if (lecture.completed) stats[lecture.subject_id].completed++;
        return;
      }
      
      // Try to match with subject_name
      if (lecture.subject_name) {
        const subject = GATE_SUBJECTS.find(s => s.name === lecture.subject_name);
        if (subject) {
          stats[subject.id].total++;
          if (lecture.completed) stats[subject.id].completed++;
        }
      }
    });
    
    setSubjectStats(stats);
  }, [lectures]);
  
  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  const handleViewLectures = (subjectId: string) => {
    navigate(`/subject/${subjectId}/lectures`);
  };
  
  // Filter and sort subjects based on user selections
  const getFilteredSubjects = () => {
    let filtered = [...GATE_SUBJECTS];
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(subject => subject.category === filter);
    }
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const statsA = subjectStats[a.id] || { total: 0, completed: 0 };
      const statsB = subjectStats[b.id] || { total: 0, completed: 0 };
      
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'progress') {
        const progressA = calculateProgress(statsA.completed, statsA.total);
        const progressB = calculateProgress(statsB.completed, statsB.total);
        return progressB - progressA;
      } else if (sortBy === 'importance') {
        const importanceOrder = { high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance as keyof typeof importanceOrder] - importanceOrder[a.importance as keyof typeof importanceOrder];
      }
      return 0;
    });
    
    return filtered;
  };
  
  const filteredSubjects = getFilteredSubjects();
  
  // Render color badge for importance
  const renderImportanceBadge = (importance: string) => {
    const classes = {
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[importance as keyof typeof classes]}`}>
        {importance}
      </span>
    );
  };
  
  // Calculate count of subjects with high progress (>70%)
  const highProgressCount = GATE_SUBJECTS.filter(subject => {
    const stats = subjectStats[subject.id] || { total: 0, completed: 0 };
    return calculateProgress(stats.completed, stats.total) > 70;
  }).length;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-full px-2 sm:px-0">
      {/* Header section with statistics */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
        {/* Abstract pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#smallGrid)" />
          </svg>
        </div>
        
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 sm:p-2 bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">GATE CSE Subjects</h2>
                  <p className="text-sm sm:text-base text-indigo-100 max-w-md">
                    Track your preparation progress across all key subjects
                  </p>
                </div>
              </div>
              
              <div className="mt-1 sm:mt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm sm:text-base text-white font-medium">Overall Progress</h3>
                  <Badge className="bg-white/20 text-white hover:bg-white/30 text-xs sm:text-sm">
                    {overallProgress()}%
                  </Badge>
                </div>
                <div className="relative h-2 sm:h-2.5 w-full max-w-md bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-indigo-300 rounded-full"
                    style={{ width: `${overallProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2.5 rounded-full bg-white/10">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-indigo-200">Total Subjects</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{GATE_SUBJECTS.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2.5 rounded-full bg-white/10">
                    <BarChart4 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-indigo-200">Completion</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{overallProgress()}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2.5 rounded-full bg-white/10">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-indigo-200">Strong Subjects</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{highProgressCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search subjects..."
              className="pl-10 h-9 sm:h-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
            <Tabs 
              defaultValue={filter} 
              value={filter} 
              onValueChange={setFilter}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-5 h-8 sm:h-9 w-full sm:w-auto">
                <TabsTrigger value="all" className="text-[10px] sm:text-xs h-7 sm:h-8 px-1 sm:px-2">All</TabsTrigger>
                <TabsTrigger value="core" className="text-[10px] sm:text-xs h-7 sm:h-8 px-1 sm:px-2">Core</TabsTrigger>
                <TabsTrigger value="mathematics" className="text-[10px] sm:text-xs h-7 sm:h-8 px-1 sm:px-2">Math</TabsTrigger>
                <TabsTrigger value="advanced" className="text-[10px] sm:text-xs h-7 sm:h-8 px-1 sm:px-2">Advanced</TabsTrigger>
                <TabsTrigger value="general" className="text-[10px] sm:text-xs h-7 sm:h-8 px-1 sm:px-2">General</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center justify-between w-full sm:justify-start gap-3">
              <select 
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 h-8 sm:h-9"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="importance">Sort by Importance</option>
              </select>
              
              <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 h-8 sm:h-9">
                <Button 
                  variant={view === 'grid' ? "default" : "ghost"} 
                  size="sm"
                  className="h-6 sm:h-7 px-1.5 sm:px-2"
                  onClick={() => setView('grid')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </Button>
                <Button 
                  variant={view === 'list' ? "default" : "ghost"}
                  size="sm"
                  className="h-6 sm:h-7 px-1.5 sm:px-2"
                  onClick={() => setView('list')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subjects Grid/List View */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">No subjects found</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : view === 'grid' ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredSubjects.map((subject) => {
          const stats = subjectStats[subject.id] || { total: 0, completed: 0 };
          const progress = calculateProgress(stats.completed, stats.total);
            const IconComponent = subject.icon || BookOpen;
            
            // Determine card background based on progress
            const getCardBg = () => {
              if (progress >= 70) return "border-green-200 dark:border-green-800/30";
              if (progress >= 30) return "border-amber-200 dark:border-amber-800/30";
              return "border-blue-200 dark:border-blue-800/30";
            };
          
          return (
            <Card 
              key={subject.id} 
              className={`overflow-hidden transition-all duration-300 rounded-xl shadow-sm hover:shadow-md ${getCardBg()}`}
            >
              <CardContent className="p-0">
                <div className="relative flex flex-col h-full">
                  {/* Subject icon and title header */}
                  <div className="p-3 sm:p-5 pb-3 sm:pb-4">
                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                      <div className={`relative group w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${subject.color} shadow`}>
                        <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                        {/* Subtle animated glow effect on hover */}
                        <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                            <Badge 
                              variant={subject.importance === 'high' ? "destructive" : subject.importance === 'medium' ? "default" : "outline"}
                              className="px-1.5 sm:px-2 py-0 h-4 sm:h-5 text-[9px] sm:text-[10px] uppercase tracking-wider font-medium"
                            >
                              {subject.importance}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className="capitalize px-1.5 sm:px-2 py-0 h-4 sm:h-5 text-[9px] sm:text-[10px] uppercase tracking-wider font-medium"
                            >
                              {subject.category}
                            </Badge>
                          </div>
                          
                          {/* Progress circle */}
                          <div className="relative w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0">
                            <svg className="w-7 h-7 sm:w-9 sm:h-9 transform -rotate-90">
                              <circle
                                cx="14"
                                cy="14"
                                r="12"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="transparent"
                                className="text-gray-200 dark:text-gray-700"
                              />
                              <circle
                                cx="14"
                                cy="14"
                                r="12"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 12}
                                strokeDashoffset={2 * Math.PI * 12 * (1 - progress / 100)}
                                className={`${
                                  progress >= 70 
                                    ? "text-green-500 dark:text-green-400" 
                                    : progress >= 30 
                                      ? "text-amber-500 dark:text-amber-400" 
                                      : "text-blue-500 dark:text-blue-400"
                                }`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] sm:text-xs font-medium">{progress}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg leading-tight mt-0.5 truncate">{subject.name}</h3>
                        
                        <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                            <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span>{subject.total_topics} topics</span>
                          </span>
                          <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span>{stats.completed}/{stats.total || 0} completed</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar section */}
                  <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{stats.completed} of {stats.total || 0}</span>
                      </div>
                      
                      <div className="h-1 sm:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            progress >= 70 
                              ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                              : progress >= 30 
                                ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                                : "bg-gradient-to-r from-blue-400 to-indigo-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between mt-1 text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">
                        <span>Beginning</span>
                        <span>Advanced</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status and actions footer */}
                  <div className="px-3 sm:px-5 py-3 sm:py-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                      progress >= 70 
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
                        : progress >= 30 
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" 
                          : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    }`}>
                      {progress < 30 ? 'Getting Started' : progress < 70 ? 'Making Progress' : 'Almost Complete'}
                    </div>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                    onClick={() => handleViewLectures(subject.id)}
                  >
                      View Lectures
                      <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className="col-span-6 sm:col-span-5">Subject</div>
              <div className="col-span-2 text-center hidden sm:block">Importance</div>
              <div className="col-span-4 sm:col-span-3 text-center">Progress</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            
            {filteredSubjects.map((subject) => {
              const stats = subjectStats[subject.id] || { total: 0, completed: 0 };
              const progress = calculateProgress(stats.completed, stats.total);
              const IconComponent = subject.icon || BookOpen;
              
              return (
                <div key={subject.id} className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 items-center text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="col-span-6 sm:col-span-5">
                    <div className="flex items-center">
                      <div className={`p-1.5 sm:p-2.5 rounded-md bg-gradient-to-br ${subject.color} mr-2 sm:mr-3 hidden sm:flex items-center justify-center`}>
                        <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">{subject.name}</h3>
                        <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{stats.completed}/{stats.total || '0'} lectures</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center hidden sm:block">
                    <Badge variant={subject.importance === 'high' ? "destructive" : subject.importance === 'medium' ? "default" : "outline"}
                      className="text-[9px] sm:text-xs"
                    >
                      {subject.importance}
                    </Badge>
                  </div>
                  
                  <div className="col-span-4 sm:col-span-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-grow h-1.5 sm:h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${subject.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <Badge 
                        variant={progress >= 70 ? "default" : progress >= 30 ? "secondary" : "outline"} 
                        className={`rounded-md ml-auto text-[9px] sm:text-xs ${
                          progress >= 70 
                            ? "bg-green-500 hover:bg-green-600 text-white" 
                            : progress >= 30 
                              ? "bg-amber-500 hover:bg-amber-600 text-white" 
                              : ""
                        }`}
                      >
                        {progress}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="text-[9px] sm:text-xs font-medium h-6 sm:h-8 px-1.5 sm:px-2 flex items-center mx-auto"
                      onClick={() => handleViewLectures(subject.id)}
                    >
                      <span className="hidden sm:inline">View</span>
                      <ChevronRight className="h-3 w-3 sm:ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Motivational Quote */}
      <div className="mt-8 sm:mt-12 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-800 rounded-xl p-4 sm:p-8 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <blockquote className="text-lg sm:text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 leading-relaxed">
          "Gate Zindagi Nahi hai but Gate Zindagi Badal Sakta Hai"
        </blockquote>
          <div className="w-8 h-0.5 sm:w-12 sm:h-0.5 bg-indigo-500 mx-auto my-3 sm:my-4"></div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          GATE is not life, but GATE can change your life.
        </p>
        </div>
      </div>
    </div>
  );
};

export default SubjectTracker;
