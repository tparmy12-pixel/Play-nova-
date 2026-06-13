import React, { useState, useRef } from "react";
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
import { Upload, ImagePlus } from "lucide-react";

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
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("App name zaroori hai"); return; }
    if (!user) { toast.error("Pehle login karein"); return; }
    setLoading(true);

    try {
      const appId = crypto.randomUUID();
      let apkUrl: string | null = null;
      let iconUrl: string | null = null;
      let screenshots: string[] = [];

      if (apkFile) apkUrl = await uploadFile(apkFile, "apks", `${appId}/${apkFile.name}`);
      if (iconFile) iconUrl = await uploadFile(iconFile, "app-assets", `icons/${appId}.png`);

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
        status: "approved",
        price_type: priceType,
        price: priceType === "paid" ? parseFloat(price) || 0 : 0,
        video_url: videoUrl || null,
      } as any);

      if (error) throw error;

      toast.success("App upload ho gaya!");
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
            <CardTitle className="font-display text-primary">Upload Your App</CardTitle>
            <p className="text-xs text-muted-foreground">Apna app seedhe upload karein — koi approval ya fees nahi.</p>
          </CardHeader>
          <CardContent>
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
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">App Icon</Label>
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => iconInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted/50 shrink-0"
                  >
                    {iconPreview ? (
                      <img src={iconPreview} alt="App Icon" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground">
                      {iconFile ? iconFile.name : "Icon select karne ke liye box pe tap karein"}
                    </p>
                  </div>
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setIconFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setIconPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      } else {
                        setIconPreview(null);
                      }
                    }}
                  />
                </div>
              </div>
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
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground neon-glow" disabled={loading}>
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
