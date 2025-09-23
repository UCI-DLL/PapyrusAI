import { useContext, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../../components/ui/dialog";
import Post from "../../utility/Post";
import { postAddUserToCourseGroup } from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";

interface AddCourseFormProps {
    closeForm: () => void;
}

export default function AddCourseForm({
    closeForm,
}: AddCourseFormProps): JSX.Element {
    const [session, setSession] = useState<{
        signUpCode: string;
    }>({
        signUpCode: "",
    });
    const [errors, setErrors] = useState<{
        signUpCode: string;
    }>({
        signUpCode: "",
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { setAlert } = useContext(AlertContext);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (session.signUpCode === "") {
            setErrors((prev) => ({
                ...prev,
                signUpCode: "Sign up code missing",
            }));
        } else {
            setIsLoading(true);
            Post(postAddUserToCourseGroup(), session).then((res) => {
                if (res && res.status && res.status < 300) {
                    if (res.data && res.data) {
                        closeForm();
                        setAlert({
                            message: "You have been added to the course.",
                            type: "info",
                        });
                    }
                } else {
                    setErrors({ signUpCode: "Course Not Found" });
                    setSession({ signUpCode: "" });
                }
                setIsLoading(false);
            });
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">
                    Join Course by Sign Up Code
                </DialogTitle>
                <DialogDescription>
                    Enter the unique course sign up code associated with the
                    course you want to join. Not sure what the sign up code is?
                    Ask the instructor of the course!
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="signUpCode" className="text-sm font-medium">
                        Course Sign Up Code
                    </Label>
                    <Input
                        id="signUpCode"
                        name="signUpCode"
                        placeholder="ENG190WFall2023"
                        value={session.signUpCode}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                        className={
                            errors.signUpCode !== "" ? "border-destructive focus-visible:ring-destructive" : ""
                        }
                        aria-describedby={errors.signUpCode ? "signup-error" : undefined}
                    />
                    {errors.signUpCode && (
                        <p id="signup-error" className="text-sm text-destructive" role="alert">
                            {errors.signUpCode}
                        </p>
                    )}
                </div>
                <div className="flex gap-2 justify-end">
                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        aria-label={isLoading ? "Joining course..." : "Join course"}
                    >
                        {isLoading ? "Joining..." : "Join Course"}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
