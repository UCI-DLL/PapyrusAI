import { useContext, useState, forwardRef, useImperativeHandle } from "react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import Post from "../../utility/Post";
import { postAddUserToCourseGroup } from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";

interface AddCourseFormProps {
  closeForm: () => void;
  setIsLoading: (loading: boolean) => void;
}

export interface AddCourseFormHandle {
  handleSubmit: () => void;
}

const AddCourseForm = forwardRef<AddCourseFormHandle, AddCourseFormProps>(
  ({ closeForm, setIsLoading }, ref) => {
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
    const { setAlert } = useContext(AlertContext);

    function handleSubmit() {
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

    useImperativeHandle(ref, () => ({
      handleSubmit,
    }));

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    return (
      <div className="space-y-4">
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
            className={
              errors.signUpCode !== ""
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
            aria-describedby={errors.signUpCode ? "signup-error" : undefined}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {errors.signUpCode && (
            <p
              id="signup-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.signUpCode}
            </p>
          )}
        </div>
      </div>
    );
  }
);

AddCourseForm.displayName = "AddCourseForm";

export default AddCourseForm;
