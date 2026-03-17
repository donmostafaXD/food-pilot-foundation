import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold font-display text-foreground">App is working</h1>
        <p className="text-sm text-muted-foreground">Welcome to FoodPilot Dashboard</p>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  );
};

export default Dashboard;
