import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, User, GraduationCap, Building2 } from "lucide-react";

const tierIcons: Record<string, React.ReactNode> = {
  beginner: <User className="h-4 w-4" />,
  student: <GraduationCap className="h-4 w-4" />,
  company: <Building2 className="h-4 w-4" />,
};

const DeveloperApprovals: React.FC = () => {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["admin-dev-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles for display names
  const userIds = [...new Set(accounts.map((a: any) => a.user_id))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-dev-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap: Record<string, string> = {};
  profiles.forEach((p: any) => { if (p.display_name) profileMap[p.id] = p.display_name; });

  const handleAction = async (id: string, status: "approved" | "rejected", userId: string) => {
    try {
      const updateData: any = { status };
      if (status === "rejected") {
        updateData.rejected_reason = rejectReason[id] || "Admin ne reject kiya";
      }
      const { error } = await supabase.from("developer_accounts").update(updateData).eq("id", id);
      if (error) throw error;
      toast.success(`Developer ${status === "approved" ? "approved" : "rejected"}!`);
      queryClient.invalidateQueries({ queryKey: ["admin-dev-accounts"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-black gradient-neon-text mb-6">Developer Approvals</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-muted-foreground">Koi developer request nahi hai.</p>
        ) : (
          <div className="space-y-4">
            {accounts.map((acc: any) => (
              <Card key={acc.id} className="glass border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {tierIcons[acc.tier] || tierIcons.beginner}
                      <span className="font-semibold capitalize">{acc.tier}</span>
                      <span className="text-sm text-muted-foreground">— {profileMap[acc.user_id] || "Unknown"}</span>
                    </div>
                    <Badge className={statusColor[acc.status] || statusColor.pending}>
                      {acc.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div><strong>Phone:</strong> {acc.phone_number}</div>
                    <div><strong>Aadhar:</strong> {acc.aadhar_number}</div>
                    {acc.pan_number && acc.pan_number !== "STUDENT" && <div><strong>PAN:</strong> {acc.pan_number}</div>}
                    {acc.upi_id && <div><strong>UPI:</strong> {acc.upi_id}</div>}
                    {acc.school_name && <div><strong>School:</strong> {acc.school_name}</div>}
                    {acc.company_name && <div><strong>Company:</strong> {acc.company_name}</div>}
                    {acc.gst_number && <div><strong>GST:</strong> {acc.gst_number}</div>}
                  </div>

                  {acc.selfie_url && (
                    <div className="flex gap-2">
                      <img src={acc.selfie_url} alt="Selfie" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      {acc.identity_card_url && (
                        <img src={acc.identity_card_url} alt="ID Card" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      )}
                    </div>
                  )}

                  {acc.status === "pending" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" onClick={() => handleAction(acc.id, "approved", acc.user_id)} className="bg-green-600 hover:bg-green-700 text-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Input
                        placeholder="Reject reason..."
                        className="flex-1 h-8 text-xs min-w-[120px]"
                        value={rejectReason[acc.id] || ""}
                        onChange={(e) => setRejectReason(prev => ({ ...prev, [acc.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="destructive" onClick={() => handleAction(acc.id, "rejected", acc.user_id)}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DeveloperApprovals;
