import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Shield, CheckCircle, Clock, XCircle } from "lucide-react";

const DeveloperRegister: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: devAccount, isLoading } = useQuery({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!phone || !aadhar || !pan) {
      toast.error("Sab fields bharna zaroori hai");
      return;
    }
    if (aadhar.length !== 12 || !/^\d+$/.test(aadhar)) {
      toast.error("Aadhar number 12 digit ka hona chahiye");
      return;
    }
    if (pan.length !== 10) {
      toast.error("PAN number 10 characters ka hona chahiye");
      return;
    }

    setLoading(true);
    try {
      let selfieUrl: string | null = null;
      if (selfie) {
        const path = `${user.id}/selfie.${selfie.name.split('.').pop()}`;
        const { error: uploadErr } = await supabase.storage.from("developer-docs").upload(path, selfie, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("developer-docs").getPublicUrl(path);
        selfieUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("developer_accounts").insert({
        user_id: user.id,
        phone_number: phone,
        aadhar_number: aadhar,
        pan_number: pan,
        selfie_url: selfieUrl,
      } as any);

      if (error) throw error;
      toast.success("Developer account request submit ho gaya! Admin review karega.");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.message || "Kuch galat ho gaya");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="animate-pulse h-40 w-full max-w-md bg-muted rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (devAccount) {
    const statusConfig: Record<string, { icon: React.ReactNode; color: string; message: string }> = {
      pending: { icon: <Clock className="h-8 w-8" />, color: "text-yellow-400", message: "Aapka developer account review mein hai. Admin jaldi approve karega." },
      approved: { icon: <CheckCircle className="h-8 w-8" />, color: "text-green-400", message: "Aapka developer account approved hai! Ab aap games upload kar sakte hain." },
      rejected: { icon: <XCircle className="h-8 w-8" />, color: "text-red-400", message: `Account reject ho gaya. Reason: ${(devAccount as any).rejected_reason || "N/A"}` },
    };
    const status = statusConfig[(devAccount as any).status] || statusConfig.pending;

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card className="glass border-border/50 text-center">
            <CardContent className="py-8 space-y-4">
              <div className={status.color}>{status.icon}</div>
              <h2 className="font-display text-xl font-bold">Developer Account</h2>
              <p className="text-muted-foreground text-sm">{status.message}</p>
              {(devAccount as any).status === "approved" && (
                <Button onClick={() => navigate("/upload")} className="gradient-neon text-primary-foreground">
                  Upload Game
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md pb-20">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display gradient-neon-text flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Developer Account
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Game upload karne ke liye developer verification zaroori hai.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXXXXXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Aadhar Card Number *</Label>
                <Input
                  value={aadhar}
                  onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="12 digit Aadhar number"
                  maxLength={12}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>PAN Card Number *</Label>
                <Input
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Selfie Photo *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-neon text-primary-foreground neon-glow"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Apply for Developer Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DeveloperRegister;
