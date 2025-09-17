import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertTriangle, BookOpen, ArrowLeft } from 'lucide-react';

export default function LoginError() {
  const location = useLocation();
  const state = location.state;

  return (
    <main className="bg-background text-foreground min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl" />
              <BookOpen className="relative h-16 w-16 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">PapyrusAI</h1>
            <p className="text-muted-foreground">There was a problem signing you in</p>
          </div>
        </header>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong!
            </CardTitle>
            <CardDescription>
              We encountered an error while trying to sign you in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {state?.message && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {state.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Please try signing in again. If the problem persists, contact your instructor or system administrator.
              </p>

              <Button
                className="w-full"
                onClick={() => window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}