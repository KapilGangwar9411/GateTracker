import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Dashboard from "@/components/Dashboard";
import TaskScheduler from "@/components/TaskScheduler";
import SubjectTracker from "@/components/SubjectTracker";
import StudyTimer from "@/components/StudyTimer";
import QuickNotes from "@/components/QuickNotes";
import Reminders from "@/components/Reminders";
import MotivationalPopup from "@/components/MotivationalPopup";
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';

const Index = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tabFromUrl = searchParams.get('tab');
  
  // Determine active tab based on URL path or search params
  const getInitialTab = () => {
    const path = location.pathname.split('/')[1]; // Get the first part of the path
    
    // Map paths to tab values
    const pathToTab = {
      'dashboard': 'dashboard',
      'tasks': 'tasks',
      'study-timer': 'timer',
      'subjects': 'subjects',
      'notes': 'notes',
      'reminders': 'reminders'
    };
    
    // If we're on a specific page path, return the corresponding tab
    if (path && pathToTab[path]) {
      return pathToTab[path];
    }
    
    // Otherwise use the tab from search params or default to dashboard
    return tabFromUrl || "dashboard";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // Effect to update active tab when URL changes
  useEffect(() => {
    const newActiveTab = getInitialTab();
    setActiveTab(newActiveTab);
  }, [location.pathname, tabFromUrl]);
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Map tab values to paths
    const tabToPath = {
      'dashboard': '/dashboard',
      'tasks': '/tasks',
      'timer': '/study-timer',
      'subjects': '/subjects',
      'notes': '/notes',
      'reminders': '/reminders'
    };
    
    // Navigate to the corresponding path
    if (tabToPath[value]) {
      navigate(tabToPath[value]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-['Bricolage_Grotesque',sans-serif]">
      <Navbar />
      
      <div className="flex-grow container py-6 px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="overflow-x-auto">
            <TabsList className="mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="tasks">
            <TaskScheduler />
          </TabsContent>
          
          <TabsContent value="subjects">
            <SubjectTracker />
          </TabsContent>
          
          <TabsContent value="timer">
            <StudyTimer />
          </TabsContent>
          
          <TabsContent value="notes">
            <QuickNotes />
          </TabsContent>
          
          <TabsContent value="reminders">
            <Reminders />
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
      
      {/* Motivational Popup - outside container for proper overlay */}
      <MotivationalPopup />
    </div>
  );
};

export default Index;
