import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import VideoAd from "@/components/VideoAd";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Star, Calendar, HardDrive, Tag, Shield, CheckCircle, XCircle, AlertTriangle, IndianRupee, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AppDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAd, setShowAd] = useState(false);
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("apps").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ["active-promotions-with-video"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotion_requests")
        .select("video_url")
        .eq("status", "approved")
        .not("video_url", "is", null);
      if (error) throw error;
      return (data || []).filter((p: any) => p.video_url);
    },
  });

  const { data: userInstall } = useQuery({
    queryKey: ["user-install", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_installs")
        .select("*")
        .eq("app_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch ratings
  const { data: ratings = [] } = useQuery({
    queryKey: ["app-ratings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_ratings")
        .select("*")
        .eq("app_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // User's existing rating
  const { data: myRating } = useQuery({
    queryKey: ["my-rating", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_ratings")
        .select("*")
        .eq("app_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (data) {
        setUserRating((data as any).rating);
        setReviewText((data as any).review_text || "");
      }
      return data;
    },
    enabled: !!id && !!user,
  });

  // App review/safety info
  const { data: appReview } = useQuery({
    queryKey: ["app-review", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_reviews")
        .select("*")
        .eq("app_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const isInstalled = !!userInstall;
  const hasUpdate = isInstalled && app && userInstall?.installed_version !== app.version;

  const proceedDownload = async () => {
    if (!app || !user) return;
    await supabase.from("downloads").insert({ app_id: app.id, user_id: user.id });
    await supabase.rpc("increment_download_count", { _app_id: app.id });
    if (userInstall) {
      await supabase.from("user_installs").update({ installed_version: app.version, updated_at: new Date().toISOString() } as any).eq("id", (userInstall as any).id);
    } else {
      await supabase.from("user_installs").insert({ app_id: app.id, user_id: user.id, installed_version: app.version } as any);
    }
    if (!app.apk_url) { toast.error("APK abhi available nahi hai."); return; }
    toast.success(`${app.name} download ho raha hai...`);
    const link = document.createElement("a");
    link.href = app.apk_url;
    link.download = `${app.name.replace(/\s+/g, '-')}.apk`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    queryClient.invalidateQueries({ queryKey: ["user-install", id] });
  };

  const handleDownload = async () => {
    if (!app) return;
    if (!user) { toast.error("Please login to download"); return; }
    if (promotions.length > 0) {
      const randomPromo = promotions[Math.floor(Math.random() * promotions.length)];
      setAdVideoUrl(randomPromo.video_url);
      setShowAd(true);
    } else {
      proceedDownload();
    }
  };

  const handleSubmitRating = async () => {
    if (!user || !id || userRating === 0) { toast.error("Rating select karein"); return; }
    setSubmittingRating(true);
    try {
      if (myRating) {
        await supabase.from("app_ratings").update({ rating: userRating, review_text: reviewText || null } as any).eq("id", (myRating as any).id);
      } else {
        await supabase.from("app_ratings").insert({ app_id: id, user_id: user.id, rating: userRating, review_text: reviewText || null } as any);
      }
      toast.success("Rating submit ho gayi!");
      queryClient.invalidateQueries({ queryKey: ["app-ratings", id] });
      queryClient.invalidateQueries({ queryKey: ["my-rating", id] });
      queryClient.invalidateQueries({ queryKey: ["app", id] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (isLoading) {
    return <Layout><div className="container mx-auto px-4 py-12"><div className="animate-pulse space-y-4"><div className="h-24 w-24 rounded-3xl bg-muted" /><div className="h-6 bg-muted rounded w-1/3" /></div></div></Layout>;
  }
  if (!app) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">App not found.</div></Layout>;
  }

  const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + (r as any).rating, 0) / ratings.length) : null;

  // Safety features list
  const safetyFeatures = [
    { label: "APK File Available", has: !!app.apk_url, icon: app.apk_url ? CheckCircle : XCircle },
    { label: "App Icon", has: !!app.icon_url, icon: app.icon_url ? CheckCircle : XCircle },
    { label: "Screenshots", has: !!(app.screenshots && app.screenshots.length > 0), icon: (app.screenshots && app.screenshots.length > 0) ? CheckCircle : XCircle },
    { label: "Description", has: !!app.description, icon: app.description ? CheckCircle : XCircle },
    { label: "External Payments", has: !(appReview as any)?.suspicious_keywords?.length, icon: (appReview as any)?.suspicious_keywords?.length ? AlertTriangle : CheckCircle, bad: !!(appReview as any)?.suspicious_keywords?.length },
    { label: "Security Scanned", has: (appReview as any)?.scan_result === 'clean', icon: (appReview as any)?.scan_result === 'clean' ? CheckCircle : XCircle },
  ];

  return (
    <Layout>
      {showAd && adVideoUrl && <VideoAd videoUrl={adVideoUrl} onComplete={() => { setShowAd(false); proceedDownload(); }} onSkip={() => { setShowAd(false); proceedDownload(); }} skipAfterSeconds={4} />}

      <div className="container mx-auto px-4 py-6 pb-20 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
          <div className="shrink-0">
            {app.icon_url ? (
              <img src={app.icon_url} alt={app.name} className="w-24 h-24 rounded-2xl object-cover neon-glow" />
            ) : (
              <div className="w-24 h-24 rounded-2xl gradient-neon flex items-center justify-center neon-glow">
                <span className="font-display text-3xl font-black text-primary-foreground">{app.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-black text-foreground truncate">{app.name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-neon-pink text-neon-pink" />{avgRating ? avgRating.toFixed(1) : "N/A"} ({ratings.length})</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" />{app.download_count}</span>
              <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" />{app.size || "N/A"}</span>
              <span className="flex items-center gap-1"><Tag className="h-3 w-3" />v{app.version}</span>
            </div>
            <Button
              onClick={handleDownload}
              className={`mt-3 px-6 text-sm neon-glow ${hasUpdate ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : isInstalled ? 'bg-green-600 hover:bg-green-700' : 'gradient-neon text-primary-foreground'}`}
            >
              <Download className="h-4 w-4 mr-1" />
              {hasUpdate ? "Update" : isInstalled ? "Downloaded ✓" : "Download APK"}
            </Button>
          </div>
        </motion.div>

        {/* Screenshots */}
        {app.screenshots && app.screenshots.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-sm font-bold text-foreground mb-2">Screenshots</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {app.screenshots.map((url, i) => (
                <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="h-48 rounded-lg border border-border/50 object-cover shrink-0" />
              ))}
            </div>
          </div>
        )}

        {/* About */}
        <div className="mt-6">
          <h2 className="font-display text-sm font-bold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{app.description || "No description available."}</p>
        </div>

        {/* Safety Info */}
        <div className="mt-6">
          <h2 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> App Safety Details
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {safetyFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <f.icon className={`h-4 w-4 ${f.bad ? 'text-yellow-400' : f.has ? 'text-green-400' : 'text-red-400'}`} />
                <span className={f.bad ? 'text-yellow-400' : f.has ? 'text-muted-foreground' : 'text-red-400'}>
                  {f.label}{f.bad ? ` (${(appReview as any)?.suspicious_keywords?.join(', ')})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rate this App */}
        {user && (
          <div className="mt-6">
            <h2 className="font-display text-sm font-bold text-foreground mb-3">Rate this App</h2>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setUserRating(s)}>
                  <Star className={`h-7 w-7 transition-colors ${s <= userRating ? 'fill-neon-pink text-neon-pink' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Review likhein (optional)..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={2}
              className="mb-2"
            />
            <Button onClick={handleSubmitRating} disabled={submittingRating || userRating === 0} size="sm" className="gradient-neon text-primary-foreground">
              {myRating ? "Update Rating" : "Submit Rating"}
            </Button>
          </div>
        )}

        {/* Reviews */}
        {ratings.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-sm font-bold text-foreground mb-3">Reviews ({ratings.length})</h2>
            <div className="space-y-3">
              {ratings.slice(0, 10).map((r: any) => (
                <div key={r.id} className="bg-card border border-border/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-neon-pink text-neon-pink' : 'text-muted-foreground'}`} />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.review_text && <p className="text-xs text-muted-foreground">{r.review_text}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 text-xs text-muted-foreground">
          <p>Category: {app.category} · Updated: {new Date(app.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </Layout>
  );
};

export default AppDetail;
