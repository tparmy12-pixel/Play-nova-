import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Shield, CheckCircle, Clock, XCircle, ImagePlus } from "lucide-react";

const DeveloperRegister: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tier, setTier] = useState("beginner");
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");
  const [upiId, setUpiId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [identityCard, setIdentityCard] = useState<File | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selfieRef = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLInputElement>(null);

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

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from("developer-docs").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("developer-docs").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!phone || !aadhar) {
      toast.error("Phone aur Aadhar zaroori hai");
      return;
    }
    if (aadhar.length !== 12 || !/^\d+$/.test(aadhar)) {
      toast.error("Aadhar number 12 digit ka hona chahiye");
      return;
    }
    if (tier === "beginner" && !pan) {
      toast.error("PAN card zaroori hai");
      return;
    }
    if (tier === "beginner" && !upiId) {
      toast.error("UPI ID zaroori hai");
      return;
    }
    if (tier === "student" && !schoolName) {
      toast.error("School/College name zaroori hai");
      return;
    }
    if (tier === "company" && (!companyName || !gstNumber)) {
      toast.error("Company details zaroori hain");
      return;
    }

    setLoading(true);
    try {
      let selfieUrl: string | null = null;
      let identityCardUrl: string | null = null;

      if (selfie) {
        selfieUrl = await uploadFile(selfie, `${user.id}/selfie.${selfie.name.split('.').pop()}`);
      }
      if (identityCard) {
        identityCardUrl = await uploadFile(identityCard, `${user.id}/identity.${identityCard.name.split('.').pop()}`);
      }

      const { error } = await supabase.from("developer_accounts").insert({
        user_id: user.id,
        phone_number: phone,
        aadhar_number: aadhar,
        pan_number: tier === "student" ? "STUDENT" : pan,
        selfie_url: selfieUrl,
        tier,
        upi_id: upiId || null,
        school_name: tier === "student" ? schoolName : null,
        identity_card_url: identityCardUrl,
        company_name: tier === "company" ? companyName : null,
        gst_number: tier === "company" ? gstNumber : null,
      } as any);

      if (error) throw error;
      toast.success("Developer account request submit ho gaya! Admin approve karega.");
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
      approved: { icon: <CheckCircle className="h-8 w-8" />, color: "text-green-400", message: "Aapka developer account approved hai! Ab aap apps/games upload kar sakte hain." },
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
              <p className="text-sm text-muted-foreground">Tier: <span className="font-semibold capitalize">{(devAccount as any).tier || "beginner"}</span></p>
              <p className="text-muted-foreground text-sm">{status.message}</p>
              {(devAccount as any).status === "approved" && (
                <Button onClick={() => navigate("/upload")} className="gradient-neon text-primary-foreground">
                  Upload App / Game
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
              App/Game upload karne ke liye developer verification zaroori hai. Admin approve karega.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tier Selection */}
              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">👤 Beginner (Individual)</SelectItem>
                    <SelectItem value="student">🎓 Student</SelectItem>
                    <SelectItem value="company">🏢 Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Common Fields */}
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" required />
              </div>
              <div className="space-y-2">
                <Label>Aadhar Card Number *</Label>
                <Input value={aadhar} onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12 digit Aadhar number" maxLength={12} required />
              </div>

              {/* Beginner Fields */}
              {tier === "beginner" && (
                <>
                  <div className="space-y-2">
                    <Label>PAN Card Number *</Label>
                    <Input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" maxLength={10} required />
                  </div>
                  <div className="space-y-2">
                    <Label>UPI ID *</Label>
                    <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" required />
                  </div>
                </>
              )}

              {/* Student Fields */}
              {tier === "student" && (
                <>
                  <div className="space-y-2">
                    <Label>School / College Name *</Label>
                    <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Apna school ya college ka naam" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Identity Card (School/College ID)</Label>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => idCardRef.current?.click()}
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted/50 shrink-0"
                      >
                        {identityPreview ? (
                          <img src={identityPreview} alt="ID Card" className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{identityCard ? identityCard.name : "ID card upload karein"}</p>
                      <input ref={idCardRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setIdentityCard(file);
                        if (file) { const r = new FileReader(); r.onload = (ev) => setIdentityPreview(ev.target?.result as string); r.readAsDataURL(file); }
                        else setIdentityPreview(null);
                      }} />
                    </div>
                  </div>
                </>
              )}

              {/* Company Fields */}
              {tier === "company" && (
                <>
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company ka naam" required />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number *</Label>
                    <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} placeholder="GST Registration Number" required />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN Card Number *</Label>
                    <Input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" maxLength={10} required />
                  </div>
                  <div className="space-y-2">
                    <Label>UPI ID *</Label>
                    <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="company@upi" required />
                  </div>
                </>
              )}

              {/* Selfie */}
              <div className="space-y-2">
                <Label>Selfie Photo *</Label>
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => selfieRef.current?.click()}
                    className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted/50 shrink-0"
                  >
                    {selfiePreview ? (
                      <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{selfie ? selfie.name : "Selfie lene ke liye tap karein"}</p>
                  <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelfie(file);
                    if (file) { const r = new FileReader(); r.onload = (ev) => setSelfiePreview(ev.target?.result as string); r.readAsDataURL(file); }
                    else setSelfiePreview(null);
                  }} />
                </div>
              </div>

              <Button type="submit" className="w-full gradient-neon text-primary-foreground neon-glow" disabled={loading}>
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
