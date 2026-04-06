import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Upload, AlertTriangle, Shield, Code, ImagePlus } from "lucide-react";

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
  const [priceType, setPriceType] = useState("free");
  const [price, setPrice] = useState("");
  const [apkFile, setApkFile] = useState<File | null>(null);
  
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  // Check developer account for Games category
  const { data: devAccount } = useQuery({
    queryKey: ["developer-account", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isDevApproved = (devAccount as any)?.status === "approved";
  const needsDev = category === "Games" && !isDevApproved;

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const detectSuspiciousKeywords = (text: string): string[] => {
    const keywords = ["razorpay", "stripe", "upi", "paytm", "phonepe", "google pay", "payment gateway"];
    return keywords.filter(k => text.toLowerCase().includes(k));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("App name zaroori hai"); return; }
    if (!user) { toast.error("Pehle login karein"); return; }
    if (needsDev) { toast.error("Game upload ke liye developer account approved hona chahiye"); return; }
    setLoading(true);

    try {
      const appId = crypto.randomUUID();
      let apkUrl: string | null = null;
      let iconUrl: string | null = null;
      let screenshots: string[] = [];

      if (apkFile) apkUrl = await uploadFile(apkFile, "apks", `${appId}/${apkFile.name}`);
      
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
        price_type: priceType,
        price: priceType === "paid" ? parseFloat(price) || 0 : 0,
        video_url: videoUrl || null,
      } as any);

      if (error) throw error;

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
      toast.error(err.message || "Kuch galat ho gaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-lg pb-20">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display gradient-neon-text">Upload Your App</CardTitle>
            <p className="text-xs text-muted-foreground">Admin review ke baad app store mein dikhega.</p>
          </CardHeader>
          <CardContent>
            {/* SDK & Commission Notice */}
            <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary">Payment SDK Required</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agar aapke app mein paid features hain to sirf <strong>bs Store Payment SDK</strong> use karein. 
                    Koi bhi external payment gateway (Razorpay, Stripe, UPI direct) allowed nahi hai — detect hone par app reject ho jayega.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 mt-2">
                <Code className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Commission:</strong> 30% platform, 70% developer. 
                    <a href="/sdk-docs" className="text-primary underline ml-1" onClick={(e) => { e.preventDefault(); navigate("/sdk-docs"); }}>SDK Documentation →</a>
                  </p>
                </div>
              </div>
            </div>

            {needsDev && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium">Developer Account Required</p>
                  <p className="text-xs text-muted-foreground">Game upload ke liye pehle developer account banayein aur verify karayein.</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate("/developer")}>
                    Developer Account Apply
                  </Button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">App Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Version</Label>
                  <Input value={version} onChange={(e) => setVersion(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Size</Label>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Auto" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Price Type */}
              <div className="space-y-1.5">
                <Label className="text-xs">App Type *</Label>
                <Select value={priceType} onValueChange={setPriceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">🆓 Free</SelectItem>
                    <SelectItem value="paid">💰 Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {priceType === "paid" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Price (₹) *</Label>
                  <Input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 49" />
                  <p className="text-[10px] text-muted-foreground">30% platform commission katega, 70% aapko milega</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">APK File (max 200MB)</Label>
                <Input type="file" accept=".apk" onChange={(e) => setApkFile(e.target.files?.[0] || null)} />
                {apkFile && <p className="text-[10px] text-muted-foreground">{apkFile.name} ({(apkFile.size / (1024*1024)).toFixed(1)} MB)</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Screenshots</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => setScreenshotFiles(Array.from(e.target.files || []))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Demo Video URL (YouTube link)</Label>
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <Button type="submit" className="w-full gradient-neon text-primary-foreground neon-glow" disabled={loading || needsDev}>
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
