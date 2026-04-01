import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Key, Save } from "lucide-react";

const API_KEYS = [
  { key: "virustotal_api_key", label: "VirusTotal API Key", description: "APK malware scanning ke liye" },
  { key: "razorpay_key_id", label: "Razorpay Key ID", description: "In-app purchases ke liye" },
  { key: "razorpay_key_secret", label: "Razorpay Key Secret", description: "Payment verification ke liye" },
];

const ApiSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getSettingValue = (key: string) => {
    return values[key] ?? settings.find((s) => s.key === key)?.value ?? "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const apiKey of API_KEYS) {
        const val = values[apiKey.key];
        if (val === undefined) continue;
        
        const existing = settings.find((s) => s.key === apiKey.key);
        if (existing) {
          await supabase.from("admin_settings").update({ value: val }).eq("key", apiKey.key);
        } else {
          await supabase.from("admin_settings").insert({ key: apiKey.key, value: val });
        }
      }
      toast.success("API settings saved!");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      setValues({});
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display gradient-neon-text flex items-center gap-2">
              <Key className="h-5 w-5" /> API Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Yahan apni API keys upload karein. Yeh keys server-side verification ke liye use hongi.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
              </div>
            ) : (
              <>
                {API_KEYS.map((apiKey) => (
                  <div key={apiKey.key} className="space-y-2">
                    <Label>{apiKey.label}</Label>
                    <Input
                      type="password"
                      placeholder={apiKey.description}
                      value={getSettingValue(apiKey.key)}
                      onChange={(e) => setValues({ ...values, [apiKey.key]: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{apiKey.description}</p>
                  </div>
                ))}
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-neon text-primary-foreground neon-glow">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save API Keys"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ApiSettings;
