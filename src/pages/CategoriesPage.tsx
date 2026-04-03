import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import AppCard from "@/components/AppCard";
import { motion } from "framer-motion";
import { Gamepad2, MessageSquare, Wrench, Film, GraduationCap, MoreHorizontal } from "lucide-react";

const CATEGORIES = [
  { name: "Social", icon: MessageSquare },
  { name: "Games", icon: Gamepad2 },
  { name: "Tools", icon: Wrench },
  { name: "Entertainment", icon: Film },
  { name: "Education", icon: GraduationCap },
  { name: "Other", icon: MoreHorizontal },
];

const CategoriesPage: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);

  const { data: apps = [] } = useQuery({
    queryKey: ["apps-by-category", selected],
    queryFn: async () => {
      let q = supabase.from("apps").select("*").eq("status", "approved").order("download_count", { ascending: false });
      if (selected) q = q.eq("category", selected);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-20">
        <h1 className="font-display text-2xl font-black text-foreground mb-4">Categories</h1>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          {CATEGORIES.map((cat) => {
            const active = selected === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelected(active ? null : cat.name)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  active
                    ? "gradient-neon text-primary-foreground border-transparent neon-glow"
                    : "bg-card border-border/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <cat.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {selected ? `No apps in ${selected}` : "Select a category to browse"}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {apps.map((app, i) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <AppCard app={app} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoriesPage;
