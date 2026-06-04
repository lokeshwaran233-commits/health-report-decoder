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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      family_profiles: {
        Row: {
          age: number | null
          avatar_color: string
          created_at: string
          gender: string | null
          id: string
          is_primary: boolean
          name: string
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          avatar_color?: string
          created_at?: string
          gender?: string | null
          id?: string
          is_primary?: boolean
          name: string
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          avatar_color?: string
          created_at?: string
          gender?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          biomarkers: Json
          content_warning: string | null
          created_at: string
          doctor_questions: Json
          id: string
          lab_name: string | null
          patient_name: string | null
          profile_id: string | null
          report_date: string | null
          status_counts: Json
          summary: string
          user_id: string
        }
        Insert: {
          biomarkers: Json
          content_warning?: string | null
          created_at?: string
          doctor_questions: Json
          id?: string
          lab_name?: string | null
          patient_name?: string | null
          profile_id?: string | null
          report_date?: string | null
          status_counts: Json
          summary: string
          user_id: string
        }
        Update: {
          biomarkers?: Json
          content_warning?: string | null
          created_at?: string
          doctor_questions?: Json
          id?: string
          lab_name?: string | null
          patient_name?: string | null
          profile_id?: string | null
          report_date?: string | null
          status_counts?: Json
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_results: {
        Row: {
          ai_confidence_note: string | null
          body_region: string | null
          cannot_assess: Json | null
          clinical_context: string | null
          created_at: string
          critical_alerts: Json | null
          id: string
          image_quality: string | null
          indeterminate: Json | null
          language: string | null
          layman_output: Json
          modality: string
          professional_output: Json
          profile_id: string | null
          urgency: string | null
          user_id: string
        }
        Insert: {
          ai_confidence_note?: string | null
          body_region?: string | null
          cannot_assess?: Json | null
          clinical_context?: string | null
          created_at?: string
          critical_alerts?: Json | null
          id?: string
          image_quality?: string | null
          indeterminate?: Json | null
          language?: string | null
          layman_output: Json
          modality: string
          professional_output: Json
          profile_id?: string | null
          urgency?: string | null
          user_id: string
        }
        Update: {
          ai_confidence_note?: string | null
          body_region?: string | null
          cannot_assess?: Json | null
          clinical_context?: string | null
          created_at?: string
          critical_alerts?: Json | null
          id?: string
          image_quality?: string | null
          indeterminate?: Json | null
          language?: string | null
          layman_output?: Json
          modality?: string
          professional_output?: Json
          profile_id?: string | null
          urgency?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          accessed_count: number
          created_at: string
          expires_at: string
          max_accesses: number
          report_id: string | null
          share_type: string
          snapshot: Json
          token: string
        }
        Insert: {
          accessed_count?: number
          created_at?: string
          expires_at: string
          max_accesses?: number
          report_id?: string | null
          share_type: string
          snapshot: Json
          token: string
        }
        Update: {
          accessed_count?: number
          created_at?: string
          expires_at?: string
          max_accesses?: number
          report_id?: string | null
          share_type?: string
          snapshot?: Json
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_tokens_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      zeno_conversations: {
        Row: {
          created_at: string
          emergency_detected: boolean
          id: string
          messages: Json
          mode: string
          report_id: string | null
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_detected?: boolean
          id?: string
          messages?: Json
          mode?: string
          report_id?: string | null
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_detected?: boolean
          id?: string
          messages?: Json
          mode?: string
          report_id?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      zeno_knowledge: {
        Row: {
          category: string | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          source: string
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          source: string
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          source?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_zeno_knowledge: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          source: string
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
