import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bell, Plus, Trash2, Clock, Edit, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { useNotifications, Reminder } from "@/contexts/NotificationContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type WeekdayOption = {
  value: string;
  label: string;
};

const WEEKDAYS: WeekdayOption[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export function ReminderManager() {
  const { reminders, createReminder, updateReminder, deleteReminder } = useNotifications();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);

  const resetForm = () => {
    setTitle("");
    setTime("08:00");
    setSelectedDays(["mon", "tue", "wed", "thu", "fri"]);
    setEditingReminder(null);
  };

  const handleOpenDialog = (reminder?: Reminder) => {
    if (reminder) {
      setTitle(reminder.title);
      setTime(reminder.time);
      setSelectedDays(reminder.days);
      setEditingReminder(reminder);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const handleSaveReminder = async () => {
    if (!title || !time || selectedDays.length === 0) return;

    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          title,
          time,
          days: selectedDays,
        });
      } else {
        await createReminder({
          title,
          time,
          days: selectedDays,
          active: true,
        });
      }
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save reminder:", error);
    }
  };

  const handleToggleActive = async (reminder: Reminder) => {
    await updateReminder(reminder.id, {
      active: !reminder.active,
    });
  };

  const handleDelete = async (reminder: Reminder) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      await deleteReminder(reminder.id);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Lecture Reminders</h2>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Reminder
          </Button>
        </div>

        {reminders.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <h3 className="text-lg font-medium mb-1">No reminders set</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create reminders to help you stay on track with your lectures.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first reminder
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reminders.map((reminder) => (
              <Card 
                key={reminder.id} 
                className={cn(
                  "transition-all hover:shadow-md",
                  !reminder.active && "opacity-70"
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{reminder.title}</span>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleToggleActive(reminder)}
                      >
                        {reminder.active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleOpenDialog(reminder)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive" 
                        onClick={() => handleDelete(reminder)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2 space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{reminder.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <div className="flex flex-wrap gap-1">
                      {WEEKDAYS.map((day) => (
                        <span 
                          key={day.value} 
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded-sm text-xs",
                            reminder.days.includes(day.value)
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground/50"
                          )}
                        >
                          {day.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(reminder.created_at), { addSuffix: true })}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingReminder ? "Edit Reminder" : "Create Reminder"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Study Session Reminder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day.value}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-md border text-sm cursor-pointer transition-colors",
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-background hover:bg-muted"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReminder} disabled={!title || !time || selectedDays.length === 0}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 