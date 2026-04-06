import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
    // Auto-redirect to home after 2 seconds
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);
    return () => clearTimeout(timer);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground">Redirecting to home...</p>
      </div>
    </div>
  );
};

export default NotFound;
