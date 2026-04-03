import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import AppCard from "@/components/AppCard";
import { motion } from "framer-motion";

const AppsPage: React.FC = () => {
  const [search, setSearch] = useState("");

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["apps-only"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .neq("category", "Games")
        .eq("status", "approved")
        .order("download_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = apps.filter((app) =>
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout showSearch onSearch={setSearch}>
      <div className="container mx-auto px-4 py-6 pb-20">
        <h1 className="font-display text-2xl font-black text-foreground mb-4">Apps</h1>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/50 animate-pulse">
                <div className="aspect-square bg-muted/50" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No apps found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((app, i) => (
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

export default AppsPage;
