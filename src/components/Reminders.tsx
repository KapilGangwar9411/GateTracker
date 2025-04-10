import React from 'react';
import { ReminderManager } from './lectures/ReminderManager';

const Reminders = () => {
  return (
    <div className="space-y-6">
                <div>
        <h2 className="text-3xl font-bold tracking-tight">Reminders</h2>
        <p className="text-muted-foreground mt-2">
          Set up reminders for your lectures and study sessions.
        </p>
      </div>
      
      <ReminderManager />
    </div>
  );
};

export default Reminders;
