
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminDashboard from './AdminDashboard';
import ServeurDashboard from './ServeurDashboard';
import ClientDashboard from './ClientDashboard';

const Dashboard = () => {
  const { userProfile, signOut } = useAuth();

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'serveur': return 'bg-blue-500';
      case 'client': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const renderDashboard = () => {
    switch (userProfile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'serveur':
        return <ServeurDashboard />;
      case 'client':
        return <ClientDashboard />;
      default:
        return <div>Rôle non reconnu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Restaurant Manager</h1>
              <Badge className={getRoleBadgeColor(userProfile.role)}>
                {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile.first_name} {userProfile.last_name}
              </span>
              <Button variant="outline" onClick={signOut}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;
