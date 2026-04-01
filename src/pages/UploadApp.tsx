import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const CATEGORIES = ["Social", "Games", "Tools", "Entertainment", "Education", "Other"];

const UploadApp: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [size, setSize] = useState("");
  const [category, setCategory] = useState("Other");
  const [loading, setLoading] = useState(false);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("App name is required"); return; }
    if (!user) { toast.error("Please login first"); return; }
    setLoading(true);

    try {
      const appId = crypto.randomUUID();
      let apkUrl: string | null = null;
      let iconUrl: string | null = null;
      let screenshots: string[] = [];

      if (apkFile) {
        apkUrl = await uploadFile(apkFile, "apks", `${appId}/${apkFile.name}`);
      }
      if (iconFile) {
        iconUrl = await uploadFile(iconFile, "app-assets", `icons/${appId}.png`);
      }
      if (screenshotFiles.length > 0) {
        screenshots = await Promise.all(
          screenshotFiles.map((f, i) => uploadFile(f, "app-assets", `screenshots/${appId}/${i}-${f.name}`))
        );
      }

      const { error } = await supabase.from("apps").insert({
        id: appId,
        name,
        description,
        version,
        size: size || (apkFile ? `${(apkFile.size / (1024 * 1024)).toFixed(1)} MB` : null),
        category,
        apk_url: apkUrl,
        icon_url: iconUrl,
        screenshots,
        uploaded_by: user.id,
        status: "pending",
      } as any);

      if (error) throw error;

      // Create basic review entry
      await supabase.from("app_reviews").insert({
        app_id: appId,
        scan_result: "pending",
        suspicious_keywords: detectSuspiciousKeywords(description),
        trust_score: 50,
      } as any);

      toast.success("App uploaded! Admin review ke baad approve hoga.");
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      navigate("/my-apps");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const detectSuspiciousKeywords = (text: string): string[] => {
    const keywords = ["razorpay", "stripe", "upi", "paytm", "phonepe", "google pay", "payment gateway"];
    return keywords.filter(k => text.toLowerCase().includes(k));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display gradient-neon-text">Upload Your App</CardTitle>
            <p className="text-sm text-muted-foreground">Upload karne ke baad admin review karega. Approve hone par app store mein dikhega.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>App Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Version</Label>
                  <Input value={version} onChange={(e) => setVersion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Auto-detected" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>App Icon</Label>
                <Input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <Label>APK File (max 200MB)</Label>
                <Input type="file" accept=".apk" onChange={(e) => setApkFile(e.target.files?.[0] || null)} />
                {apkFile && <p className="text-xs text-muted-foreground">{apkFile.name} ({(apkFile.size / (1024*1024)).toFixed(1)} MB)</p>}
              </div>
              <div className="space-y-2">
                <Label>Screenshots</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => setScreenshotFiles(Array.from(e.target.files || []))} />
              </div>
              <Button type="submit" className="w-full gradient-neon text-primary-foreground neon-glow" disabled={loading}>
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Uploading..." : "Upload App"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UploadApp;
