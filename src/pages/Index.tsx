import { useAuth } from "@/contexts/AuthContext";
import Login from "@/components/Login";
import AdminView from "@/components/AdminView";
import DeveloperView from "@/components/DeveloperView";

const Index = () => {
  const { user } = useAuth();

  // Show login if no user
  if (!user) {
    return <Login />;
  }

  // Route based on user role
  if (user.role === 'admin') {
    return <AdminView />;
  }

  if (user.role === 'developer') {
    return <DeveloperView />;
  }

  // Fallback (should never reach here)
  return <Login />;
};

export default Index;
