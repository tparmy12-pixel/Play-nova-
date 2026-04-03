export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      app_ratings: {
        Row: {
          app_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_ratings_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_reviews: {
        Row: {
          app_id: string
          created_at: string
          flagged_permissions: string[] | null
          id: string
          notes: string | null
          reviewed_by: string | null
          scan_result: string | null
          suspicious_keywords: string[] | null
          trust_score: number | null
        }
        Insert: {
          app_id: string
          created_at?: string
          flagged_permissions?: string[] | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          scan_result?: string | null
          suspicious_keywords?: string[] | null
          trust_score?: number | null
        }
        Update: {
          app_id?: string
          created_at?: string
          flagged_permissions?: string[] | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          scan_result?: string | null
          suspicious_keywords?: string[] | null
          trust_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "app_reviews_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          apk_url: string | null
          category: string
          created_at: string
          description: string | null
          download_count: number
          icon_url: string | null
          id: string
          name: string
          rating: number | null
          screenshots: string[] | null
          size: string | null
          status: string
          trust_score: number | null
          updated_at: string
          uploaded_by: string | null
          version: string
        }
        Insert: {
          apk_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          icon_url?: string | null
          id?: string
          name: string
          rating?: number | null
          screenshots?: string[] | null
          size?: string | null
          status?: string
          trust_score?: number | null
          updated_at?: string
          uploaded_by?: string | null
          version?: string
        }
        Update: {
          apk_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          icon_url?: string | null
          id?: string
          name?: string
          rating?: number | null
          screenshots?: string[] | null
          size?: string | null
          status?: string
          trust_score?: number | null
          updated_at?: string
          uploaded_by?: string | null
          version?: string
        }
        Relationships: []
      }
      developer_accounts: {
        Row: {
          aadhar_number: string
          created_at: string
          id: string
          pan_number: string
          phone_number: string
          rejected_reason: string | null
          selfie_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhar_number: string
          created_at?: string
          id?: string
          pan_number: string
          phone_number: string
          rejected_reason?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhar_number?: string
          created_at?: string
          id?: string
          pan_number?: string
          phone_number?: string
          rejected_reason?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      downloads: {
        Row: {
          app_id: string
          downloaded_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          app_id: string
          downloaded_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          app_id?: string
          downloaded_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotion_requests: {
        Row: {
          amount: number
          app_link: string
          button_style: string
          button_text: string
          created_at: string
          description: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          transaction_id: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          amount?: number
          app_link: string
          button_style?: string
          button_text?: string
          created_at?: string
          description?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          amount?: number
          app_link?: string
          button_style?: string
          button_text?: string
          created_at?: string
          description?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transaction_id?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_installs: {
        Row: {
          app_id: string
          id: string
          installed_at: string
          installed_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          id?: string
          installed_at?: string
          installed_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          id?: string
          installed_at?: string
          installed_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_installs_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_download_count: {
        Args: { _app_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
