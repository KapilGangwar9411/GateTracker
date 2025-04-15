import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Moon, Sun } from 'lucide-react';
import { NotificationCenter } from '@/components/ui/notification-center';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      // Navigation still happens even if there's an error with sign out
      // to ensure users aren't stuck if sign out fails
      navigate('/auth');
    }
  };

  return (
    <header className="border-b shadow-sm sticky top-0 z-10 bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-green-600" />
          <span className="text-xl font-bold text-green-600 font-['Bricolage_Grotesque',sans-serif]">
            <span className="hidden sm:inline">GATE Prep Tracker</span>
            <span className="sm:hidden">GPtracker</span>
          </span>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700" />
              )}
            </Button>
            <NotificationCenter />
            <div className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
