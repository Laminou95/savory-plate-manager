
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, User, MapPin } from 'lucide-react';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_customer_id_fkey(first_name, last_name),
          restaurant_tables(table_number),
          order_items(*, menu_items(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Statut de la commande mis à jour');
      fetchOrders();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
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

  const getNextStatus = (currentStatus: string) => {
    const nextStatuses = {
      'en_attente': 'confirmee',
      'confirmee': 'en_preparation',
      'en_preparation': 'prete',
      'prete': 'servie',
      'servie': 'payee'
    };
    return nextStatuses[currentStatus as keyof typeof nextStatuses];
  };

  const getNextStatusText = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusText(nextStatus) : null;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Commandes</h2>
        <Button onClick={fetchOrders}>Actualiser</Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Aucune commande pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order: any) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Commande #{order.id.slice(0, 8)}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>
                            {order.profiles?.first_name} {order.profiles?.last_name}
                          </span>
                        </div>
                        {order.restaurant_tables && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>Table {order.restaurant_tables.table_number}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(order.created_at).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">€{order.total_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Articles commandés :</h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{item.menu_items?.name}</span>
                            <span className="text-gray-500 ml-2">x{item.quantity}</span>
                            {item.special_instructions && (
                              <p className="text-sm text-gray-600 italic">
                                Note: {item.special_instructions}
                              </p>
                            )}
                          </div>
                          <span className="font-medium">€{(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div>
                      <h4 className="font-medium mb-1">Notes :</h4>
                      <p className="text-gray-600 italic">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    {getNextStatus(order.status) && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Marquer comme "{getNextStatusText(order.status)}"
                      </Button>
                    )}
                    {order.status !== 'annulee' && order.status !== 'payee' && (
                      <Button
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'annulee')}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersManagement;
