import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, Menu, ChevronDown, User, LogOut, Settings, Bell } from 'lucide-react';
import { NotificationCenter } from '@/components/ui/notification-center';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/auth');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.substring(0, 1).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass effect navbar */}
      <div className="relative backdrop-blur-sm bg-white/75 dark:bg-slate-900/75 border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo section */}
            <Link 
              to="/" 
              className="flex items-center transition-all duration-300 hover:opacity-80 group"
            >
              <div className="relative flex items-center overflow-hidden rounded-full border-2 border-transparent group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-all duration-300">
                <div className="bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:via-violet-500/20 dark:to-purple-500/20 absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                  src="/logos/Gate.png" 
                  alt="GATE Prep Tracker Logo" 
                  className="h-20 sm:h-24 md:h-28 w-auto object-contain p-1"
                />
              </div>
            </Link>
            
            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[260px] sm:w-[300px]">
                  <div className="flex flex-col h-full py-6">
                    <div className="px-2 mb-6">
                      <div className="flex items-center gap-3 mb-6">
                        <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user?.email}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Student</span>
                        </div>
                      </div>
                      
                      <nav className="space-y-1">
                        <Link to="/dashboard" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                          Dashboard
                        </Link>
                        <Link to="/tasks" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                          Tasks
                        </Link>
                        <Link to="/study-timer" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                          Study Timer
                        </Link>
                        <Link to="/video-study" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                          Video Study
                        </Link>
                        <Link to="/subjects" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                          Subjects
                        </Link>
                        <Link to="/notes" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                          Notes
                        </Link>
                        <Link to="/reminders" className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsMobileMenuOpen(false)}>
                          Reminders
                        </Link>
                      </nav>
                    </div>
                    
                    <div className="mt-auto space-y-3 px-2">
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-sm">Dark Mode</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={toggleTheme}
                          className="rounded-full h-8 w-8"
                        >
                          {theme === 'dark' ? (
                            <Sun className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <Moon className="h-4 w-4 text-slate-700" />
                          )}
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Desktop navigation */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <div className="hidden lg:flex items-center space-x-1">
                  <Link to="/dashboard" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Dashboard</Link>
                  <Link to="/tasks" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Tasks</Link>
                  <Link to="/study-timer" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Study Timer</Link>
                  <Link to="/video-study" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Video Study</Link>
                  <Link to="/subjects" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Subjects</Link>
                  <Link to="/notes" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Notes</Link>
                  <Link to="/reminders" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">Reminders</Link>
                </div>
                
                <div className="flex items-center gap-2 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleTheme}
                    className="rounded-full h-9 w-9 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <Moon className="h-5 w-5 text-slate-700" />
                    )}
                  </Button>
                  
                  <NotificationCenter />
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="rounded-full h-9 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 pl-2 pr-3">
                        <Avatar className="h-7 w-7 border-2 border-slate-200 dark:border-slate-700">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium hidden xl:block max-w-[120px] truncate">
                          {user.email?.split('@')[0]}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuItem className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center text-red-500 focus:text-red-500"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
