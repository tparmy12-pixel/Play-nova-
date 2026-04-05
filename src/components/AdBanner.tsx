import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdBannerProps {
  position?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position = "home" }) => {
  const { data: banners = [] } = useQuery({
    queryKey: ["ad-banners", position],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_banners")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleClick = async (banner: any) => {
    try {
      await supabase.rpc("increment_banner_click", { _banner_id: banner.id });
    } catch {}
    if (banner.link_url) {
      window.open(banner.link_url, "_blank");
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="overflow-x-auto flex gap-3 pb-2 px-4">
      {banners.map((b: any) => (
        <div
          key={b.id}
          onClick={() => handleClick(b)}
          className="shrink-0 w-[300px] h-[140px] rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-border/30"
        >
          <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
};

export default AdBanner;
