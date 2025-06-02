
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Clock, Euro } from 'lucide-react';
import MenuDisplay from './MenuDisplay';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'en_attente': 'bg-yellow-500',
      'confirmee': 'bg-blue-500',
      'en_preparation': 'bg-orange-500',
      'prete': 'bg-green-500',
      'servie': 'bg-gray-500',
      'payee': 'bg-purple-500',
      'annulee': 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'en_attente': 'En attente',
      'confirmee': 'Confirmée',
      'en_preparation': 'En préparation',
      'prete': 'Prête',
      'servie': 'Servie',
      'payee': 'Payée',
      'annulee': 'Annulée'
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes actives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((order: any) => !['servie', 'payee', 'annulee'].includes(order.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total dépensé</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{orders.reduce((total: number, order: any) => total + (order.total_amount || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Toutes commandes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Menu du Restaurant</CardTitle>
            <CardDescription>Découvrez nos délicieux plats</CardDescription>
          </CardHeader>
          <CardContent>
            <MenuDisplay />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes Commandes Récentes</CardTitle>
            <CardDescription>Suivi de vos commandes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500">Chargement...</p>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-500">Aucune commande pour le moment</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Commande #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                      <p className="text-sm font-medium mt-1">€{order.total_amount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
