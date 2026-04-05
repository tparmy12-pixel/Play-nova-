import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, MousePointerClick } from "lucide-react";

const ManageBanners: React.FC = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState("home");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_banners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleAdd = async () => {
    if (!title.trim()) { toast.error("Title zaroori hai"); return; }
    setAdding(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const path = `banners/${Date.now()}-${imageFile.name}`;
        const { data, error } = await supabase.storage.from("app-assets").upload(path, imageFile, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("app-assets").getPublicUrl(data.path);
        finalImageUrl = urlData.publicUrl;
      }
      if (!finalImageUrl) { toast.error("Image URL ya file upload karein"); setAdding(false); return; }

      const { error } = await supabase.from("ad_banners").insert({
        title,
        image_url: finalImageUrl,
        link_url: linkUrl || null,
        position,
      } as any);
      if (error) throw error;
      toast.success("Banner added!");
      setTitle(""); setImageUrl(""); setLinkUrl(""); setImageFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("ad_banners").update({ is_active: !current } as any).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
  };

  const deleteBanner = async (id: string) => {
    await supabase.from("ad_banners").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    toast.success("Banner deleted");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl pb-20">
        <h1 className="font-display text-2xl font-black gradient-neon-text mb-6">Ads & Banners</h1>

        {/* Add Banner */}
        <Card className="glass border-border/50 mb-6">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Add Banner</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Banner title" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Image URL (or upload below)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Upload Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Link URL (optional)</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Page</SelectItem>
                  <SelectItem value="app_detail">App Detail Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={adding} className="gradient-neon text-primary-foreground w-full">
              {adding ? "Adding..." : "Add Banner"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Banners */}
        <h2 className="font-semibold text-sm mb-3">Active Banners ({banners.length})</h2>
        {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : (
          <div className="space-y-3">
            {banners.map((b: any) => (
              <Card key={b.id} className="glass border-border/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-20 h-12 rounded overflow-hidden shrink-0 bg-muted">
                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{b.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                      {b.position} · <MousePointerClick className="h-3 w-3" /> {b.click_count} clicks
                    </p>
                  </div>
                  <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} />
                  <Button variant="ghost" size="icon" onClick={() => deleteBanner(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageBanners;
