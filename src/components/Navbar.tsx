import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import { NotificationCenter } from '@/components/ui/notification-center';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Navbar = () => {
  const { user, signOut } = useAuth();
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
    <header className="border-b bg-white shadow-sm sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-green-600" />
          <span className="text-xl font-bold text-green-600 font-['Bricolage_Grotesque',sans-serif]">GATE Prep Tracker</span>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
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
