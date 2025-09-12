import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Mail, Lock, User, Chrome } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignUpForm = z.infer<typeof signUpSchema>;
type SignInForm = z.infer<typeof signInSchema>;

export const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", displayName: "" }
  });

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" }
  });

  const handleSignUp = async (data: SignUpForm) => {
    setLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.displayName);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account created! Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (data: SignInForm) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({
          title: "Error", 
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 legal-gradient rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">LegalEase</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="legal-card shadow-glow">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {mode === "signin" 
                  ? "Sign in to access your legal documents" 
                  : "Join thousands of users simplifying legal documents"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Sign In */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              {mode === "signup" ? (
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="displayName"
                        placeholder="Enter your full name"
                        className="pl-10"
                        {...signUpForm.register("displayName")}
                      />
                    </div>
                    {signUpForm.formState.errors.displayName && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.displayName.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        {...signUpForm.register("email")}
                      />
                    </div>
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10"
                        {...signUpForm.register("password")}
                      />
                    </div>
                    {signUpForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full legal-gradient" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        {...signInForm.register("email")}
                      />
                    </div>
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        {...signInForm.register("password")}
                      />
                    </div>
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full legal-gradient" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              )}

              {/* Switch Mode */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {mode === "signin" 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};