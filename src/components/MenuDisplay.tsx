
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Clock, Euro } from 'lucide-react';

const MenuDisplay = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('menu_items')
          .select('*, menu_categories(name)')
          .eq('is_available', true)
          .order('name')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories(categoriesRes.data || []);
      setMenuItems(itemsRes.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du menu:', error);
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} ajouté au panier`);
  };

  const createOrder = async () => {
    if (!user || cart.length === 0) return;

    try {
      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: user.id,
          status: 'en_attente',
          notes: 'Commande via l\'application client'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Ajouter les items à la commande
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Commande passée avec succès !');
      setCart([]);
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter((item: any) => item.category_id === categoryId);
  };

  const getTotalCart = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement du menu...</div>;
  }

  return (
    <div className="space-y-6">
      {cart.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Panier ({cart.length} articles)</span>
              <span className="text-2xl">€{getTotalCart().toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name} x{item.quantity}</span>
                  <span>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Button onClick={createOrder} className="w-full">
              Commander
            </Button>
          </CardContent>
        </Card>
      )}

      {categories.map((category: any) => {
        const categoryItems = getItemsByCategory(category.id);
        if (categoryItems.length === 0) return null;

        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryItems.map((item: any) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <div className="text-right">
                          <p className="font-bold text-lg">€{item.price}</p>
                          {item.preparation_time && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.preparation_time} min
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      )}
                      
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Allergènes:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.allergens.map((allergen: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => addToCart(item)}
                        className="w-full"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter au panier
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucun plat disponible pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MenuDisplay;
