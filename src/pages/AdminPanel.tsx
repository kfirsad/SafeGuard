import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Image, 
  Tag, 
  Languages, 
  Save, 
  Plus, 
  Trash2, 
  Upload,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Translation {
  key: string;
  en: string;
  es: string;
  fr: string;
  he: string;
}

const defaultCategories: Category[] = [
  { id: "medical", name: "Medical", icon: "🏥", color: "hsl(199 89% 48%)" },
  { id: "fire", name: "Fire", icon: "🔥", color: "hsl(8 85% 60%)" },
  { id: "police", name: "Police", icon: "🚔", color: "hsl(258 90% 66%)" },
  { id: "accident", name: "Accident", icon: "🚗", color: "hsl(38 95% 55%)" },
];

const defaultTranslations: Translation[] = [
  { key: "app_name", en: "SafeGuard", es: "SafeGuard", fr: "SafeGuard", he: "סייפגארד" },
  { key: "sos_button", en: "SOS", es: "SOS", fr: "SOS", he: "מצוקה" },
  { key: "report_emergency", en: "Report Emergency", es: "Reportar Emergencia", fr: "Signaler une urgence", he: "דווח על מצב חירום" },
  { key: "active_events", en: "Active Events", es: "Eventos Activos", fr: "Événements actifs", he: "אירועים פעילים" },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [logoUrl, setLogoUrl] = useState(() => 
    localStorage.getItem("admin_logo") || ""
  );
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("admin_categories");
    return saved ? JSON.parse(saved) : defaultCategories;
  });
  const [translations, setTranslations] = useState<Translation[]>(() => {
    const saved = localStorage.getItem("admin_translations");
    return saved ? JSON.parse(saved) : defaultTranslations;
  });
  const [newCategory, setNewCategory] = useState({ name: "", icon: "", color: "#ef4444" });
  const [activeTab, setActiveTab] = useState("branding");

  const saveLogo = () => {
    localStorage.setItem("admin_logo", logoUrl);
    toast({ title: "Logo saved", description: "Logo URL has been updated" });
  };

  const saveCategories = () => {
    localStorage.setItem("admin_categories", JSON.stringify(categories));
    toast({ title: "Categories saved", description: "Report categories have been updated" });
  };

  const addCategory = () => {
    if (!newCategory.name || !newCategory.icon) {
      toast({ 
        title: "Missing fields", 
        description: "Please fill in name and icon",
        variant: "destructive" 
      });
      return;
    }
    
    const id = newCategory.name.toLowerCase().replace(/\s+/g, '_');
    setCategories([...categories, { ...newCategory, id }]);
    setNewCategory({ name: "", icon: "", color: "#ef4444" });
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const updateTranslation = (key: string, lang: keyof Translation, value: string) => {
    setTranslations(translations.map(t => 
      t.key === key ? { ...t, [lang]: value } : t
    ));
  };

  const saveTranslations = () => {
    localStorage.setItem("admin_translations", JSON.stringify(translations));
    toast({ title: "Translations saved", description: "All translations have been updated" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage app settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="branding" className="gap-2">
              <Image className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="w-4 h-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="translations" className="gap-2">
              <Languages className="w-4 h-4" />
              Translations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-4"
            >
              <h2 className="text-lg font-semibold text-foreground">Logo & Branding</h2>
              
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Logo URL</label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="bg-secondary border-border flex-1"
                  />
                  <Button onClick={saveLogo} variant="outline" className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </div>
              </div>

              {logoUrl && (
                <div className="p-4 bg-secondary rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <img 
                    src={logoUrl} 
                    alt="Logo preview" 
                    className="max-h-20 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="categories">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Report Categories</h2>
                
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div 
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <span className="font-medium text-foreground">{category.name}</span>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeCategory(category.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Add New Category</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="bg-secondary border-border"
                    />
                    <Input
                      placeholder="Icon (emoji)"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                      className="bg-secondary border-border"
                    />
                    <Input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="bg-secondary border-border h-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addCategory} variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Category
                    </Button>
                    <Button onClick={saveCategories} variant="emergency" className="gap-2">
                      <Save className="w-4 h-4" />
                      Save All
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="translations">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Translations</h2>
                <Button onClick={saveTranslations} variant="emergency" className="gap-2">
                  <Save className="w-4 h-4" />
                  Save All
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-sm text-muted-foreground">Key</th>
                      <th className="text-left py-2 px-2 text-sm text-muted-foreground">English</th>
                      <th className="text-left py-2 px-2 text-sm text-muted-foreground">Spanish</th>
                      <th className="text-left py-2 px-2 text-sm text-muted-foreground">French</th>
                      <th className="text-left py-2 px-2 text-sm text-muted-foreground">Hebrew</th>
                    </tr>
                  </thead>
                  <tbody>
                    {translations.map((translation) => (
                      <tr key={translation.key} className="border-b border-border/50">
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {translation.key}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={translation.en}
                            onChange={(e) => updateTranslation(translation.key, 'en', e.target.value)}
                            className="bg-secondary border-border h-8 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={translation.es}
                            onChange={(e) => updateTranslation(translation.key, 'es', e.target.value)}
                            className="bg-secondary border-border h-8 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={translation.fr}
                            onChange={(e) => updateTranslation(translation.key, 'fr', e.target.value)}
                            className="bg-secondary border-border h-8 text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={translation.he}
                            onChange={(e) => updateTranslation(translation.key, 'he', e.target.value)}
                            className="bg-secondary border-border h-8 text-sm dir-rtl"
                            dir="rtl"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
