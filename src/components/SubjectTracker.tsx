import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, BookOpen, Layers, CheckCircle, AlertCircle, Bookmark, BarChart4, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  { id: 'toc', name: 'Theory of Computation', color: 'from-amber-500 to-amber-600', icon: BookOpen, total_topics: 8, completed_topics: 0, importance: 'medium', category: 'theory' },
  { id: 'compiler-design', name: 'Compiler Design', color: 'from-rose-500 to-rose-600', icon: BookOpen, total_topics: 10, completed_topics: 0, importance: 'medium', category: 'advanced' },
  { id: 'os', name: 'Operating Systems', color: 'from-teal-500 to-teal-600', icon: BookOpen, total_topics: 14, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'dbms', name: 'Database Management Systems', color: 'from-indigo-500 to-indigo-600', icon: BookOpen, total_topics: 12, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'computer-networks', name: 'Computer Networks', color: 'from-pink-500 to-pink-600', icon: BookOpen, total_topics: 12, completed_topics: 0, importance: 'high', category: 'core' },
  { id: 'computer-organization', name: 'Computer Organization & Architecture', color: 'from-blue-500 to-blue-600', icon: BookOpen, total_topics: 15, completed_topics: 0, importance: 'medium', category: 'advanced' },
  { id: 'digital-logic', name: 'Digital Logic', color: 'from-green-500 to-green-600', icon: BookOpen, total_topics: 8, completed_topics: 0, importance: 'medium', category: 'core' },
  { id: 'discrete-math', name: 'Discrete Mathematics', color: 'from-purple-500 to-purple-600', icon: BookOpen, total_topics: 10, completed_topics: 0, importance: 'medium', category: 'mathematics' },
  { id: 'engineering-math', name: 'Engineering Mathematics', color: 'from-amber-500 to-amber-600', icon: BookOpen, total_topics: 12, completed_topics: 0, importance: 'high', category: 'mathematics' },
  { id: 'aptitude', name: 'General Aptitude', color: 'from-rose-500 to-rose-600', icon: BookOpen, total_topics: 6, completed_topics: 0, importance: 'medium', category: 'general' }
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
    <div className="space-y-8 max-w-full">
      {/* Header section with statistics */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-xl overflow-hidden shadow-lg">
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">GATE CSE Subjects</h2>
          <p className="text-indigo-100 text-sm max-w-md mb-6">
            Track your preparation progress across all key subjects for GATE CSE examination
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-white/20 mr-4">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-indigo-100">Total Subjects</p>
                  <p className="text-xl font-bold">{GATE_SUBJECTS.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-white/20 mr-4">
                  <BarChart4 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-indigo-100">Overall Progress</p>
                  <p className="text-xl font-bold">{overallProgress()}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-white/20 mr-4">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-indigo-100">Strong Subjects</p>
                  <p className="text-xl font-bold">{highProgressCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-2 w-full bg-gradient-to-r from-indigo-400 to-blue-500" style={{ width: `${overallProgress()}%` }}></div>
      </div>
      
      {/* Filter controls */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search subjects..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm px-3 py-1.5"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="core">Core CS</option>
              <option value="mathematics">Mathematics</option>
              <option value="theory">Theory</option>
              <option value="advanced">Advanced</option>
              <option value="general">General</option>
            </select>
            
            <select 
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700 rounded-md text-sm px-3 py-1.5"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
              <option value="importance">Sort by Importance</option>
            </select>
            
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1">
              <button 
                className={`px-2 py-1 rounded ${view === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                onClick={() => setView('grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
              <button 
                className={`px-2 py-1 rounded ${view === 'list' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                onClick={() => setView('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subjects Grid/List View */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No subjects found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subject) => {
            const stats = subjectStats[subject.id] || { total: 0, completed: 0 };
            const progress = calculateProgress(stats.completed, stats.total);
            const IconComponent = subject.icon || BookOpen;
            
            return (
              <Card 
                key={subject.id} 
                className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900/80 hover:shadow-md transition-all duration-300 rounded-lg"
              >
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${subject.color} bg-opacity-90 shadow-sm`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base truncate">{subject.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-shrink-0">
                            {renderImportanceBadge(subject.importance)}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{subject.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{stats.completed}/{stats.total || '0'} lectures</span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      
                      <div className="relative">
                        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${subject.color}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="absolute -bottom-4 left-0 right-0 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-8">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {progress < 30 ? 'Getting Started' : progress < 70 ? 'Making Progress' : 'Almost Complete'}
                        </span>
                        <button 
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium"
                          onClick={() => handleViewLectures(subject.id)}
                        >
                          View Lectures
                          <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
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
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
              <div className="col-span-5">Subject</div>
              <div className="col-span-2 text-center">Importance</div>
              <div className="col-span-3 text-center">Progress</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
            
            {filteredSubjects.map((subject) => {
              const stats = subjectStats[subject.id] || { total: 0, completed: 0 };
              const progress = calculateProgress(stats.completed, stats.total);
              const IconComponent = subject.icon || BookOpen;
              
              return (
                <div key={subject.id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="col-span-5">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-md bg-gradient-to-br ${subject.color} bg-opacity-10 mr-3 hidden sm:block`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.completed}/{stats.total || '0'} lectures</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    {renderImportanceBadge(subject.importance)}
                  </div>
                  
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-grow h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${subject.color}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-9 text-right">{progress}%</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <button 
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-xs"
                      onClick={() => handleViewLectures(subject.id)}
                    >
                      View
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Motivational Quote */}
      <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="max-w-md mx-auto">
          <Bookmark className="h-8 w-8 text-indigo-500 mx-auto mb-4" />
          <blockquote className="text-xl md:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4 leading-relaxed">
            "Gate Zindagi Nahi hai but Gate Zindagi Badal Sakta Hai"
          </blockquote>
          <div className="w-12 h-0.5 bg-indigo-500 mx-auto my-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            GATE is not life, but GATE can change your life.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubjectTracker;
