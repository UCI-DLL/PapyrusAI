import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2, KeyRound, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
// import { useNavigate } from "react-router";


interface ForgotPasswordProps {
  setUser: (user: any) => void;
}

// implement
export default function ForgotPassword(props: ForgotPasswordProps): JSX.Element {
  // let navigator = useNavigate();
  const [session, setSession] = useState({
    username: "",
    password: "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.username === "" || session.username.length === 0) {
      setUsernameError("This field cannot be empty.");
    } else {
      setUsernameError("");
    }

    if (session.username !== "" && session.password !== "") {
      setIsLoading(true);
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append("username", session.username);
      formData.append("password", session.password);
      //
      // Post(v3Login(organization.pk), formData).then((val) => {
      //   if (val.status && val.status < 300) {
      //     //save user to local
      //     localStorage.setItem(
      //       "vstreamer_user",
      //       JSON.stringify(val.data.data)
      //     );
      //     localStorage.setItem("sessionid", val.data.data.sessionid);
      //     //update App with user info
      //     props.setUser(val.data.data);
      //     //redirect to home page
      //     navigator("/");
      //   } else {
      //     setIsLoading(false);
      //     if (val.data && val.data.form && val.data.form.errors) {
      //       setUsernameError(
      //         val.data.form.errors[Object.keys(val.data.form.errors)[0]]
      //       );
      //       setPasswordError(
      //         val.data.form.errors[Object.keys(val.data.form.errors)[0]]
      //       );
      //     }
      //   }
      // });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession({ ...session, [e.target.name]: e.target.value });
  }

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
            <p className="text-muted-foreground">Reset your password to continue</p>
          </div>
        </header>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Forgot Password?
            </CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a verification code to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  name="username"
                  type="email"
                  placeholder="your.email@school.edu"
                  value={session.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={usernameError ? "border-destructive" : ""}
                />
                {usernameError && (
                  <Alert variant="destructive">
                    <AlertDescription>{usernameError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                onClick={handleSubmit}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Verification Code
              </Button>

              <div className="border-t pt-4">
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link 
                    to="/register" 
                    className="underline underline-offset-2 hover:no-underline text-primary font-medium"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}