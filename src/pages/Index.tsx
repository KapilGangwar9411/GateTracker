import React, { useState } from 'react';
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

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-background font-['Bricolage_Grotesque',sans-serif]">
      <Navbar />
      
      <div className="flex-grow container py-6 px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
