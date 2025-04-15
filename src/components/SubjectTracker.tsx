import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// Hardcoded GATE CSE subjects
const GATE_SUBJECTS = [
  { id: 'data-structures', name: 'Data Structures & Algorithms', color: 'from-blue-500 to-blue-600', total_topics: 15, completed_topics: 0 },
  { id: 'algorithms', name: 'Algorithm Design & Analysis', color: 'from-green-500 to-green-600', total_topics: 12, completed_topics: 0 },
  { id: 'programming', name: 'Programming & Data Structures', color: 'from-purple-500 to-purple-600', total_topics: 10, completed_topics: 0 },
  { id: 'toc', name: 'Theory of Computation', color: 'from-amber-500 to-amber-600', total_topics: 8, completed_topics: 0 },
  { id: 'compiler-design', name: 'Compiler Design', color: 'from-rose-500 to-rose-600', total_topics: 10, completed_topics: 0 },
  { id: 'os', name: 'Operating Systems', color: 'from-teal-500 to-teal-600', total_topics: 14, completed_topics: 0 },
  { id: 'dbms', name: 'Database Management Systems', color: 'from-indigo-500 to-indigo-600', total_topics: 12, completed_topics: 0 },
  { id: 'computer-networks', name: 'Computer Networks', color: 'from-pink-500 to-pink-600', total_topics: 12, completed_topics: 0 },
  { id: 'computer-organization', name: 'Computer Organization & Architecture', color: 'from-blue-500 to-blue-600', total_topics: 15, completed_topics: 0 },
  { id: 'digital-logic', name: 'Digital Logic', color: 'from-green-500 to-green-600', total_topics: 8, completed_topics: 0 },
  { id: 'discrete-math', name: 'Discrete Mathematics', color: 'from-purple-500 to-purple-600', total_topics: 10, completed_topics: 0 },
  { id: 'engineering-math', name: 'Engineering Mathematics', color: 'from-amber-500 to-amber-600', total_topics: 12, completed_topics: 0 },
  { id: 'aptitude', name: 'General Aptitude', color: 'from-rose-500 to-rose-600', total_topics: 6, completed_topics: 0 }
];

const SubjectTracker = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjectStats, setSubjectStats] = useState<Record<string, {total: number, completed: number}>>({});
  
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
    lectures.forEach((lecture: any) => {
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

  return (
    <div className="space-y-8 max-w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">GATE CSE Subjects</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Track your preparation progress across all key subjects for GATE CSE examination
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GATE_SUBJECTS.map((subject) => {
          const stats = subjectStats[subject.id] || { total: 0, completed: 0 };
          const progress = calculateProgress(stats.completed, stats.total);
          
          return (
            <Card 
              key={subject.id} 
              className="overflow-hidden border-none bg-background shadow-sm hover:shadow-md transition-all duration-300"
            >
              <CardContent className="p-0">
                <div className={`h-2 bg-gradient-to-r ${subject.color}`}></div>
                <div className="p-4 sm:p-5">
                  <div className="mb-4">
                    <h3 className="font-medium text-base sm:text-lg mb-1 truncate">{subject.name}</h3>
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>{stats.completed}/{stats.total || 0} lectures</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  
                  <button 
                    className="w-full group flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                    onClick={() => handleViewLectures(subject.id)}
                  >
                    <span>View lectures</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 bg-gradient-to-r from-muted/80 to-muted rounded-lg p-6 text-center">
        <blockquote className="text-base sm:text-lg font-medium mb-2">
          "Gate Zindagi Nahi hai but Gate Zindagi Badal Sakta Hai"
        </blockquote>
        <p className="text-xs sm:text-sm text-muted-foreground italic">
          GATE is not life, but GATE can change your life.
        </p>
      </div>
    </div>
  );
};

export default SubjectTracker;
