import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Reminders = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reminders</h2>
        <p className="text-muted-foreground mt-2">
          Set up reminders for your study sessions.
        </p>
      </div>
      
      <Card className="w-full shadow-lg">
        <CardContent className="p-8 text-center">
          <p className="text-xl text-muted-foreground">Coming Soon</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reminders;
