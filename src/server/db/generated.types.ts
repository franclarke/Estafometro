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
      analysis_runs: {
        Row: {
          case_id: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          hard_rules_applied: string[]
          id: string
          llm_model: string
          pipeline_version: string
          prompt_version: string
          raw_llm_response: Json | null
          status: string
          subscores: Json
        }
        Insert: {
          case_id: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          hard_rules_applied?: string[]
          id?: string
          llm_model: string
          pipeline_version: string
          prompt_version: string
          raw_llm_response?: Json | null
          status: string
          subscores?: Json
        }
        Update: {
          case_id?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          hard_rules_applied?: string[]
          id?: string
          llm_model?: string
          pipeline_version?: string
          prompt_version?: string
          raw_llm_response?: Json | null
          status?: string
          subscores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          case_id: string | null
          created_at: string
          event_type: string
          id: number
          ip_hash: string | null
          properties: Json
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          event_type: string
          id?: number
          ip_hash?: string | null
          properties?: Json
        }
        Update: {
          case_id?: string | null
          created_at?: string
          event_type?: string
          id?: number
          ip_hash?: string | null
          properties?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_patterns: {
        Row: {
          created_at: string
          fingerprint: string
          first_seen_at: string
          id: string
          last_seen_at: string
          occurrence_count: number
          promoted_pattern_id: string | null
          signature_components: Json
          status: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          occurrence_count?: number
          promoted_pattern_id?: string | null
          signature_components: Json
          status?: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          occurrence_count?: number
          promoted_pattern_id?: string | null
          signature_components?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_patterns_promoted_pattern_id_fkey"
            columns: ["promoted_pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      case_candidate_pattern_links: {
        Row: {
          candidate_pattern_id: string
          case_id: string
          created_at: string
          id: string
        }
        Insert: {
          candidate_pattern_id: string
          case_id: string
          created_at?: string
          id?: string
        }
        Update: {
          candidate_pattern_id?: string
          case_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_candidate_pattern_links_candidate_pattern_id_fkey"
            columns: ["candidate_pattern_id"]
            isOneToOne: false
            referencedRelation: "candidate_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_candidate_pattern_links_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_entities: {
        Row: {
          case_id: string
          confidence: number
          created_at: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          normalized_value: string
          source: string
          value: string
        }
        Insert: {
          case_id: string
          confidence: number
          created_at?: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          normalized_value: string
          source: string
          value: string
        }
        Update: {
          case_id?: string
          confidence?: number
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          normalized_value?: string
          source?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_entities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_evidence: {
        Row: {
          case_id: string
          created_at: string
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          expires_at: string | null
          id: string
          ocr_text: string | null
          parsed_metadata: Json | null
          raw_text: string | null
          storage_path: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          evidence_type: Database["public"]["Enums"]["evidence_type"]
          expires_at?: string | null
          id?: string
          ocr_text?: string | null
          parsed_metadata?: Json | null
          raw_text?: string | null
          storage_path?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          evidence_type?: Database["public"]["Enums"]["evidence_type"]
          expires_at?: string | null
          id?: string
          ocr_text?: string | null
          parsed_metadata?: Json | null
          raw_text?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_signals: {
        Row: {
          case_id: string
          confidence: number
          created_at: string
          evidence_ref_id: string | null
          id: string
          signal_code: string
          sources: string[]
          weight: number
        }
        Insert: {
          case_id: string
          confidence: number
          created_at?: string
          evidence_ref_id?: string | null
          id?: string
          signal_code: string
          sources?: string[]
          weight: number
        }
        Update: {
          case_id?: string
          confidence?: number
          created_at?: string
          evidence_ref_id?: string | null
          id?: string
          signal_code?: string
          sources?: string[]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_signals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_signals_signal_code_fkey"
            columns: ["signal_code"]
            isOneToOne: false
            referencedRelation: "signal_catalog"
            referencedColumns: ["code"]
          },
        ]
      }
      cases: {
        Row: {
          analyzed_at: string | null
          case_type: string | null
          confidence: number | null
          created_at: string
          expires_at: string | null
          final_risk_level: Database["public"]["Enums"]["risk_level"] | null
          final_risk_score: number | null
          id: string
          ip_hash: string | null
          merged_case_text: string | null
          narrative_text: string | null
          privacy_mode: Database["public"]["Enums"]["privacy_mode"]
          public_id: string
          status: Database["public"]["Enums"]["case_status"]
          summary: string | null
          updated_at: string
          user_agent_hash: string | null
        }
        Insert: {
          analyzed_at?: string | null
          case_type?: string | null
          confidence?: number | null
          created_at?: string
          expires_at?: string | null
          final_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          final_risk_score?: number | null
          id?: string
          ip_hash?: string | null
          merged_case_text?: string | null
          narrative_text?: string | null
          privacy_mode?: Database["public"]["Enums"]["privacy_mode"]
          public_id: string
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string | null
          updated_at?: string
          user_agent_hash?: string | null
        }
        Update: {
          analyzed_at?: string | null
          case_type?: string | null
          confidence?: number | null
          created_at?: string
          expires_at?: string | null
          final_risk_level?: Database["public"]["Enums"]["risk_level"] | null
          final_risk_score?: number | null
          id?: string
          ip_hash?: string | null
          merged_case_text?: string | null
          narrative_text?: string | null
          privacy_mode?: Database["public"]["Enums"]["privacy_mode"]
          public_id?: string
          status?: Database["public"]["Enums"]["case_status"]
          summary?: string | null
          updated_at?: string
          user_agent_hash?: string | null
        }
        Relationships: []
      }
      external_checks: {
        Row: {
          case_id: string
          check_type: Database["public"]["Enums"]["check_type"]
          created_at: string
          id: string
          result_json: Json | null
          result_summary: string
          signal_impact: Json | null
          status: Database["public"]["Enums"]["check_status"]
        }
        Insert: {
          case_id: string
          check_type: Database["public"]["Enums"]["check_type"]
          created_at?: string
          id?: string
          result_json?: Json | null
          result_summary: string
          signal_impact?: Json | null
          status: Database["public"]["Enums"]["check_status"]
        }
        Update: {
          case_id?: string
          check_type?: Database["public"]["Enums"]["check_type"]
          created_at?: string
          id?: string
          result_json?: Json | null
          result_summary?: string
          signal_impact?: Json | null
          status?: Database["public"]["Enums"]["check_status"]
        }
        Relationships: [
          {
            foreignKeyName: "external_checks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          case_id: string
          comment: string | null
          created_at: string
          false_alarm: boolean
          helpful: boolean
          id: string
        }
        Insert: {
          case_id: string
          comment?: string | null
          created_at?: string
          false_alarm?: boolean
          helpful: boolean
          id?: string
        }
        Update: {
          case_id?: string
          comment?: string | null
          created_at?: string
          false_alarm?: boolean
          helpful?: boolean
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_matches: {
        Row: {
          case_id: string
          created_at: string
          id: string
          match_score: number
          matched_signals: string[]
          pattern_id: string
          pattern_version_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          match_score: number
          matched_signals?: string[]
          pattern_id: string
          pattern_version_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          match_score?: number
          matched_signals?: string[]
          pattern_id?: string
          pattern_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_matches_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_matches_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_matches_pattern_version_id_fkey"
            columns: ["pattern_version_id"]
            isOneToOne: false
            referencedRelation: "pattern_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_versions: {
        Row: {
          created_at: string
          definition_snapshot: Json
          id: string
          pattern_id: string
          source_hash: string
          version: number
        }
        Insert: {
          created_at?: string
          definition_snapshot: Json
          id?: string
          pattern_id: string
          source_hash: string
          version: number
        }
        Update: {
          created_at?: string
          definition_snapshot?: Json
          id?: string
          pattern_id?: string
          source_hash?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pattern_versions_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      patterns: {
        Row: {
          category: string
          code: string
          created_at: string
          current_version_id: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patterns_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "pattern_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          bucket_key: string
          count: number
          created_at: string
          id: string
          ip_hash: string
          window_start: string
        }
        Insert: {
          bucket_key: string
          count?: number
          created_at?: string
          id?: string
          ip_hash: string
          window_start: string
        }
        Update: {
          bucket_key?: string
          count?: number
          created_at?: string
          id?: string
          ip_hash?: string
          window_start?: string
        }
        Relationships: []
      }
      signal_catalog: {
        Row: {
          code: string
          created_at: string
          default_weight: number
          description: string
          group_name: string
          is_active: boolean
          severity: Database["public"]["Enums"]["signal_severity"]
          user_label: string
        }
        Insert: {
          code: string
          created_at?: string
          default_weight: number
          description: string
          group_name: string
          is_active?: boolean
          severity: Database["public"]["Enums"]["signal_severity"]
          user_label: string
        }
        Update: {
          code?: string
          created_at?: string
          default_weight?: number
          description?: string
          group_name?: string
          is_active?: boolean
          severity?: Database["public"]["Enums"]["signal_severity"]
          user_label?: string
        }
        Relationships: []
      }
    }
    Views: {
      funnel_daily: {
        Row: {
          analyses_completed: number | null
          cases_started: number | null
          day: string | null
          feedback_submitted: number | null
        }
        Relationships: []
      }
      risk_distribution: {
        Row: {
          final_risk_level: Database["public"]["Enums"]["risk_level"] | null
          total_cases: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      case_status:
        | "received"
        | "processing"
        | "analyzed"
        | "partial"
        | "error"
        | "expired"
      check_status: "skipped" | "success" | "warning" | "failed"
      check_type:
        | "platform_bypass"
        | "domain"
        | "phone"
        | "website_consistency"
        | "public_business_presence"
        | "social_profile"
      entity_type:
        | "platform"
        | "business_name"
        | "instagram_handle"
        | "url"
        | "domain"
        | "alias"
        | "cbu"
        | "phone"
        | "authority"
        | "bank"
        | "product"
        | "payment_method"
        | "marketplace"
      evidence_type:
        | "narrative"
        | "pasted_chat"
        | "screenshot"
        | "url"
        | "username"
        | "alias"
        | "phone"
        | "note"
      privacy_mode: "minimal_retention" | "no_store_raw"
      risk_level: "low" | "medium" | "high" | "very_high"
      signal_severity: "info" | "low" | "medium" | "high" | "critical"
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
      case_status: [
        "received",
        "processing",
        "analyzed",
        "partial",
        "error",
        "expired",
      ],
      check_status: ["skipped", "success", "warning", "failed"],
      check_type: [
        "platform_bypass",
        "domain",
        "phone",
        "website_consistency",
        "public_business_presence",
        "social_profile",
      ],
      entity_type: [
        "platform",
        "business_name",
        "instagram_handle",
        "url",
        "domain",
        "alias",
        "cbu",
        "phone",
        "authority",
        "bank",
        "product",
        "payment_method",
        "marketplace",
      ],
      evidence_type: [
        "narrative",
        "pasted_chat",
        "screenshot",
        "url",
        "username",
        "alias",
        "phone",
        "note",
      ],
      privacy_mode: ["minimal_retention", "no_store_raw"],
      risk_level: ["low", "medium", "high", "very_high"],
      signal_severity: ["info", "low", "medium", "high", "critical"],
    },
  },
} as const
