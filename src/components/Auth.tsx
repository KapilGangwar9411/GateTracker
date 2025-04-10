import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { CheckCircle, XCircle, Github, Mail, ArrowRight, Loader2, EyeOff, Eye, BookOpen, CircleUserRound, KeyRound } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabase';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState<'signin' | 'signup' | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(password)) {
      toast({
        title: "Password Requirements",
        description: "Please make sure your password meets all requirements",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading('signup');
      await signUp(email, password);
      
      toast({
        title: "Confirmation email sent",
        description: "Please check your email to confirm your account",
      });
      setActiveTab('login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading('signin');
      await signIn(email, password);
      // No need to handle success as the AuthContext will update and redirect
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading('google');
      await signInWithGoogle();
      // OAuth will redirect, no need for further handling here
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      toast({
        title: "Google sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      setSocialLoading(null);
    }
  };
  
  const handleGithubSignIn = async () => {
    try {
      setSocialLoading('github');
      await signInWithGithub();
      // OAuth will redirect, no need for further handling here
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      toast({
        title: "GitHub sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      setSocialLoading(null);
    }
  };
  
  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Use Supabase directly for password reset as it's not in the auth context
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for password reset instructions",
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      
      toast({
        title: "Password reset failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00bTAtMTZjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00bTE2IDE2YzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNG0tMTYgMGMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTRtLTE2IDBjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00bTE2LTE2YzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNG0tMTYgMGMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTRtLTE2IDBjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00bTE2LTE2YzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNE0yMCAyYzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNG0xNiAwYzAtMi4yIDEuOC00IDQtNHM0IDEuOCA0IDQtMS44IDQtNCA0LTQtMS44LTQtNE0yMCAxOGMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTRtMC0xNmMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTQiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 pt-6 pb-4 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div 
          className="flex items-center gap-2 animate-fadeIn"
        >
          <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
            GATE Preparation Tracker
          </h1>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex justify-center items-center px-4 py-8 relative z-10">
        <div 
          className="w-full max-w-md animate-fadeInUp"
        >
          <Card className="overflow-hidden border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {activeTab === 'login' ? 'Welcome back!' : 'Create an account'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {activeTab === 'login' 
                  ? "Sign in to continue your learning journey" 
                  : "Join us to track your GATE preparation"
                }
              </CardDescription>
        </CardHeader>
        
            <CardContent className="space-y-5 pt-4">
              {/* Social Signin Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading === 'signin' || !!socialLoading}
                  className="relative h-11 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 
                             dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700 
                             transition-all duration-200 shadow-sm hover:shadow"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGithubSignIn}
                  disabled={loading === 'signin' || !!socialLoading}
                  className="relative h-11 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300
                             dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-700
                             transition-all duration-200 shadow-sm hover:shadow"
                >
                  {socialLoading === 'github' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  ) : (
                    <>
                      <Github className="h-5 w-5 mr-2" />
                      GitHub
                    </>
                  )}
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                    or continue with email
                  </span>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11 rounded-lg p-1 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 
                               data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 
                               dark:data-[state=active]:text-indigo-400 transition-all duration-200"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 
                               data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 
                               dark:data-[state=active]:text-indigo-400 transition-all duration-200"
                  >
                    Register
                  </TabsTrigger>
          </TabsList>
          
                <TabsContent value="login" className="mt-4 space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                          placeholder="your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                    required
                  />
                      </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password
                        </Label>
                        <Button 
                          type="button" 
                          variant="link" 
                          onClick={handleResetPassword}
                          className="h-auto p-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Forgot password?
                        </Button>
                  </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input 
                    id="password" 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                    required
                  />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={togglePasswordVisibility}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                </div>
              
                <Button 
                  type="submit"
                      disabled={loading === 'signin'}
                      className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700
                                 dark:from-indigo-500 dark:to-violet-500 dark:hover:from-indigo-600 dark:hover:to-violet-600
                                 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {loading === 'signin' ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Sign In</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                </Button>
            </form>
          </TabsContent>
          
                <TabsContent value="register" className="mt-4 space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Full Name
                      </Label>
                      <div className="relative">
                        <CircleUserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input 
                    id="fullName" 
                          placeholder="your name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                  />
                      </div>
                </div>
                
                <div className="space-y-2">
                      <Label htmlFor="emailReg" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input 
                          id="emailReg" 
                    type="email" 
                          placeholder="your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                    required
                  />
                      </div>
                </div>
                
                <div className="space-y-2">
                      <Label htmlFor="passwordReg" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Create Password
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input 
                          id="passwordReg" 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                    required
                  />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={togglePasswordVisibility}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center">
                          {validatePassword(password) ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                          )}
                          <span>Password requirements:</span>
                        </div>
                        
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center">
                            {password.length >= 8 ? (
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400 mr-1.5 flex-shrink-0" />
                            )}
                            <span className={password.length >= 8 ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center">
                            {/[A-Z]/.test(password) ? (
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400 mr-1.5 flex-shrink-0" />
                            )}
                            <span className={/[A-Z]/.test(password) ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"}>
                              At least 1 uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center">
                            {/[0-9]/.test(password) ? (
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400 mr-1.5 flex-shrink-0" />
                            )}
                            <span className={/[0-9]/.test(password) ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"}>
                              At least 1 number
                            </span>
                          </div>
                          <div className="flex items-center">
                            {/[^A-Za-z0-9]/.test(password) ? (
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-400 mr-1.5 flex-shrink-0" />
                            )}
                            <span className={/[^A-Za-z0-9]/.test(password) ? "text-gray-600 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"}>
                              At least 1 special character
                            </span>
                          </div>
                        </div>
                      </div>
                </div>
              
                <Button 
                  type="submit"
                      disabled={loading === 'signup' || !validatePassword(password)}
                      className={`w-full h-11 font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200
                                ${validatePassword(password) 
                                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                                  : "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"}`}
                    >
                      {loading === 'signup' ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Create Account</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                </Button>
            </form>
          </TabsContent>
        </Tabs>
            </CardContent>
      </Card>
          
          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 animate-fadeIn animation-delay-500">
            By signing in, you agree to our <a href="#" className="text-indigo-600 hover:underline dark:text-indigo-400">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline dark:text-indigo-400">Privacy Policy</a>.
          </p>
        </div>
      </main>
      
      {/* Footer with subtle animations */}
      <footer className="relative z-10 py-6 text-center text-sm text-gray-500 dark:text-gray-400 animate-fadeIn animation-delay-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} GATE Preparation Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
