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
      anonymous_report_usage: {
        Row: {
          created_at: string
          first_seen_at: string
          id: string
          ip_hash: string
          last_used_at: string
          reports_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_seen_at?: string
          id?: string
          ip_hash: string
          last_used_at?: string
          reports_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_seen_at?: string
          id?: string
          ip_hash?: string
          last_used_at?: string
          reports_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      biomarker_history: {
        Row: {
          biomarker_name: string
          created_at: string
          id: string
          lab_ref_max: number | null
          lab_ref_min: number | null
          profile_id: string | null
          raw_name: string
          report_date: string | null
          report_id: string | null
          status: string | null
          unit: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          biomarker_name: string
          created_at?: string
          id?: string
          lab_ref_max?: number | null
          lab_ref_min?: number | null
          profile_id?: string | null
          raw_name: string
          report_date?: string | null
          report_id?: string | null
          status?: string | null
          unit?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          biomarker_name?: string
          created_at?: string
          id?: string
          lab_ref_max?: number | null
          lab_ref_min?: number | null
          profile_id?: string | null
          raw_name?: string
          report_date?: string | null
          report_id?: string | null
          status?: string | null
          unit?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "biomarker_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "family_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomarker_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          code: string
          created_at: string
          credits: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_inr_paise: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_inr_paise: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_inr_paise?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
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
      guard_violations_log: {
        Row: {
          created_at: string
          engine_version: string | null
          id: string
          report_id: string | null
          severity: string | null
          violation_text: string | null
        }
        Insert: {
          created_at?: string
          engine_version?: string | null
          id?: string
          report_id?: string | null
          severity?: string | null
          violation_text?: string | null
        }
        Update: {
          created_at?: string
          engine_version?: string | null
          id?: string
          report_id?: string | null
          severity?: string | null
          violation_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guard_violations_log_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount_paise: number
          created_at: string
          currency: string
          fulfilled_at: string | null
          id: string
          item_code: string
          kind: string
          raw_payload: Json | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          currency?: string
          fulfilled_at?: string | null
          id?: string
          item_code: string
          kind: string
          raw_payload?: Json | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          currency?: string
          fulfilled_at?: string | null
          id?: string
          item_code?: string
          kind?: string
          raw_payload?: Json | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          ailments: string[]
          allergies: string | null
          avatar_url: string | null
          blood_group: string | null
          created_at: string
          emergency_contact: string | null
          full_name: string | null
          id: string
          medications: string | null
          phone: string | null
          sex: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          ailments?: string[]
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          emergency_contact?: string | null
          full_name?: string | null
          id: string
          medications?: string | null
          phone?: string | null
          sex?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          ailments?: string[]
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          emergency_contact?: string | null
          full_name?: string | null
          id?: string
          medications?: string | null
          phone?: string | null
          sex?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          biomarkers: Json
          clinical_engine_version: string | null
          content_warning: string | null
          created_at: string
          critical_alerts: Json | null
          data_quality_warnings: Json | null
          doctor_questions: Json
          evaluated_biomarkers: Json | null
          extraction_raw: Json | null
          guard_had_critical: boolean | null
          guard_violations_count: number | null
          id: string
          lab_name: string | null
          overall_clinical_score: number | null
          patient_name: string | null
          pattern_evaluations: Json | null
          priority_findings: Json | null
          profile_id: string | null
          report_date: string | null
          status_counts: Json
          summary: string
          user_id: string
        }
        Insert: {
          biomarkers: Json
          clinical_engine_version?: string | null
          content_warning?: string | null
          created_at?: string
          critical_alerts?: Json | null
          data_quality_warnings?: Json | null
          doctor_questions: Json
          evaluated_biomarkers?: Json | null
          extraction_raw?: Json | null
          guard_had_critical?: boolean | null
          guard_violations_count?: number | null
          id?: string
          lab_name?: string | null
          overall_clinical_score?: number | null
          patient_name?: string | null
          pattern_evaluations?: Json | null
          priority_findings?: Json | null
          profile_id?: string | null
          report_date?: string | null
          status_counts: Json
          summary: string
          user_id: string
        }
        Update: {
          biomarkers?: Json
          clinical_engine_version?: string | null
          content_warning?: string | null
          created_at?: string
          critical_alerts?: Json | null
          data_quality_warnings?: Json | null
          doctor_questions?: Json
          evaluated_biomarkers?: Json | null
          extraction_raw?: Json | null
          guard_had_critical?: boolean | null
          guard_violations_count?: number | null
          id?: string
          lab_name?: string | null
          overall_clinical_score?: number | null
          patient_name?: string | null
          pattern_evaluations?: Json | null
          priority_findings?: Json | null
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
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          monthly_report_quota: number
          name: string
          price_inr_paise: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          monthly_report_quota?: number
          name: string
          price_inr_paise?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          monthly_report_quota?: number
          name?: string
          price_inr_paise?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ultraguard_audit: {
        Row: {
          approved_count: number
          blocked_by_layer: string | null
          context_summary: string | null
          created_at: string
          downgrade_count: number
          id: string
          ip_hash: string | null
          pipeline_version: string
          processing_ms: number
          rejected_count: number
          report: Json
          sentinel: string
          surface: string
          user_id: string | null
          violation_count: number
        }
        Insert: {
          approved_count?: number
          blocked_by_layer?: string | null
          context_summary?: string | null
          created_at?: string
          downgrade_count?: number
          id?: string
          ip_hash?: string | null
          pipeline_version: string
          processing_ms?: number
          rejected_count?: number
          report: Json
          sentinel: string
          surface: string
          user_id?: string | null
          violation_count?: number
        }
        Update: {
          approved_count?: number
          blocked_by_layer?: string | null
          context_summary?: string | null
          created_at?: string
          downgrade_count?: number
          id?: string
          ip_hash?: string | null
          pipeline_version?: string
          processing_ms?: number
          rejected_count?: number
          report?: Json
          sentinel?: string
          surface?: string
          user_id?: string | null
          violation_count?: number
        }
        Relationships: []
      }
      user_entitlements: {
        Row: {
          created_at: string
          credit_balance: number
          period_started_at: string
          plan_code: string
          plan_renews_at: string | null
          plan_started_at: string | null
          plan_status: string
          reports_used_this_period: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_balance?: number
          period_started_at?: string
          plan_code?: string
          plan_renews_at?: string | null
          plan_started_at?: string | null
          plan_status?: string
          reports_used_this_period?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_balance?: number
          period_started_at?: string
          plan_code?: string
          plan_renews_at?: string | null
          plan_started_at?: string | null
          plan_status?: string
          reports_used_this_period?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
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
