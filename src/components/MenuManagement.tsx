
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const MenuManagement = () => {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    preparation_time: '15'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase.from('menu_categories').select('*').order('display_order'),
        supabase.from('menu_items').select('*, menu_categories(name)').order('name')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories(categoriesRes.data || []);
      setMenuItems(itemsRes.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('menu_categories')
        .insert([newCategory]);

      if (error) throw error;

      toast.success('Catégorie ajoutée avec succès');
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout de la catégorie');
    }
  };

  const addMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          ...newItem,
          price: parseFloat(newItem.price),
          preparation_time: parseInt(newItem.preparation_time)
        }]);

      if (error) throw error;

      toast.success('Plat ajouté avec succès');
      setNewItem({ name: '', description: '', price: '', category_id: '', preparation_time: '15' });
      setShowAddItem(false);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout du plat');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion du Menu</h2>
        <div className="space-x-2">
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Catégorie
          </Button>
          <Button onClick={() => setShowAddItem(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Plat
          </Button>
        </div>
      </div>

      {showAddCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addCategory} className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nom</Label>
                <Input
                  id="category-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category-description">Description</Label>
                <Input
                  id="category-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Ajouter</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showAddItem && (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau Plat</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addMenuItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-name">Nom</Label>
                  <Input
                    id="item-name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="item-category">Catégorie</Label>
                  <select
                    id="item-category"
                    className="w-full p-2 border rounded-md"
                    value={newItem.category_id}
                    onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="item-description">Description</Label>
                <Input
                  id="item-description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-price">Prix (€)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="item-time">Temps de préparation (min)</Label>
                  <Input
                    id="item-time"
                    type="number"
                    value={newItem.preparation_time}
                    onChange={(e) => setNewItem({...newItem, preparation_time: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Ajouter</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddItem(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Menu Actuel</CardTitle>
          <CardDescription>Liste des plats disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Temps</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.menu_categories?.name}</TableCell>
                  <TableCell>€{item.price}</TableCell>
                  <TableCell>{item.preparation_time} min</TableCell>
                  <TableCell>
                    <Badge className={item.is_available ? 'bg-green-500' : 'bg-red-500'}>
                      {item.is_available ? 'Disponible' : 'Indisponible'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuManagement;
