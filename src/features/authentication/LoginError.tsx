import { Button } from '@mui/material';
import { useLocation } from 'react-router-dom';

export default function LoginError() {
  const location = useLocation();
  const state = location.state;

  return (
    <div >
      <h1>Something went wrong!</h1>
      {state && <p>{state.message}</p>}
      <Button
        variant='contained'
        onClick={() => window.location.replace(process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : "")}
        sx={{ width: "100%" }}
      >
        Back to Login
      </Button>
    </div>
  );
}