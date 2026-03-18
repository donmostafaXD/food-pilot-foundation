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
      activity_process_map: {
        Row: {
          activity: string
          id: number
          process: string
          process_order: number
        }
        Insert: {
          activity: string
          id?: number
          process: string
          process_order: number
        }
        Update: {
          activity?: string
          id?: number
          process?: string
          process_order?: number
        }
        Relationships: []
      }
      activity_types: {
        Row: {
          activity_name: string
          id: number
          industry_type: string | null
          template: string
        }
        Insert: {
          activity_name: string
          id?: number
          industry_type?: string | null
          template: string
        }
        Update: {
          activity_name?: string
          id?: number
          industry_type?: string | null
          template?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          activity_type: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          activity_type?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          activity_type?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_equipment: {
        Row: {
          business_id: string | null
          equipment_name: string | null
          equipment_type: string | null
          id: number
        }
        Insert: {
          business_id?: string | null
          equipment_name?: string | null
          equipment_type?: string | null
          id?: number
        }
        Update: {
          business_id?: string | null
          equipment_name?: string | null
          equipment_type?: string | null
          id?: number
        }
        Relationships: []
      }
      ccp_analysis: {
        Row: {
          control_type: string | null
          corrective_action: string | null
          critical_limit: string | null
          hazard_id: number
          id: number
          likelihood: number | null
          monitoring: string | null
          process_step_id: number
          risk_score: number | null
          severity: number | null
        }
        Insert: {
          control_type?: string | null
          corrective_action?: string | null
          critical_limit?: string | null
          hazard_id: number
          id?: number
          likelihood?: number | null
          monitoring?: string | null
          process_step_id: number
          risk_score?: number | null
          severity?: number | null
        }
        Update: {
          control_type?: string | null
          corrective_action?: string | null
          critical_limit?: string | null
          hazard_id?: number
          id?: number
          likelihood?: number | null
          monitoring?: string | null
          process_step_id?: number
          risk_score?: number | null
          severity?: number | null
        }
        Relationships: []
      }
      ccp_table: {
        Row: {
          critical_limit: string | null
          hazard: string
          id: number
          is_ccp: boolean | null
          monitoring: string | null
          process: string
        }
        Insert: {
          critical_limit?: string | null
          hazard: string
          id?: number
          is_ccp?: boolean | null
          monitoring?: string | null
          process: string
        }
        Update: {
          critical_limit?: string | null
          hazard?: string
          id?: number
          is_ccp?: boolean | null
          monitoring?: string | null
          process?: string
        }
        Relationships: []
      }
      decision_tree_questions: {
        Row: {
          activity: string
          id: number
          question: string
          related_process: string | null
        }
        Insert: {
          activity: string
          id?: number
          question: string
          related_process?: string | null
        }
        Update: {
          activity?: string
          id?: number
          question?: string
          related_process?: string | null
        }
        Relationships: []
      }
      document_library: {
        Row: {
          description: string | null
          document_name: string
          id: number
          responsible: string | null
        }
        Insert: {
          description?: string | null
          document_name: string
          id?: number
          responsible?: string | null
        }
        Update: {
          description?: string | null
          document_name?: string
          id?: number
          responsible?: string | null
        }
        Relationships: []
      }
      equipment_library: {
        Row: {
          activity_type: string | null
          equipment_name: string
          id: number
          related_process: string | null
        }
        Insert: {
          activity_type?: string | null
          equipment_name: string
          id?: number
          related_process?: string | null
        }
        Update: {
          activity_type?: string | null
          equipment_name?: string
          id?: number
          related_process?: string | null
        }
        Relationships: []
      }
      haccp_plan_hazards: {
        Row: {
          control_type: string | null
          corrective_action: string | null
          critical_limit: string | null
          haccp_plan_step_id: string
          hazard_name: string
          hazard_type: string | null
          id: string
          likelihood: number
          monitoring: string | null
          risk_score: number
          severity: number
        }
        Insert: {
          control_type?: string | null
          corrective_action?: string | null
          critical_limit?: string | null
          haccp_plan_step_id: string
          hazard_name: string
          hazard_type?: string | null
          id?: string
          likelihood?: number
          monitoring?: string | null
          risk_score?: number
          severity?: number
        }
        Update: {
          control_type?: string | null
          corrective_action?: string | null
          critical_limit?: string | null
          haccp_plan_step_id?: string
          hazard_name?: string
          hazard_type?: string | null
          id?: string
          likelihood?: number
          monitoring?: string | null
          risk_score?: number
          severity?: number
        }
        Relationships: [
          {
            foreignKeyName: "haccp_plan_hazards_haccp_plan_step_id_fkey"
            columns: ["haccp_plan_step_id"]
            isOneToOne: false
            referencedRelation: "haccp_plan_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      haccp_plan_steps: {
        Row: {
          haccp_plan_id: string
          id: string
          process_name: string
          process_step_id: number | null
          step_order: number
        }
        Insert: {
          haccp_plan_id: string
          id?: string
          process_name: string
          process_step_id?: number | null
          step_order: number
        }
        Update: {
          haccp_plan_id?: string
          id?: string
          process_name?: string
          process_step_id?: number | null
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "haccp_plan_steps_haccp_plan_id_fkey"
            columns: ["haccp_plan_id"]
            isOneToOne: false
            referencedRelation: "haccp_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      haccp_plans: {
        Row: {
          activity_name: string
          branch_id: string
          business_type: string
          created_at: string
          id: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          activity_name: string
          branch_id: string
          business_type: string
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          activity_name?: string
          branch_id?: string
          business_type?: string
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "haccp_plans_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "haccp_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hazard_library: {
        Row: {
          hazard_name: string
          hazard_type: string | null
          id: number
          typical_process: string | null
        }
        Insert: {
          hazard_name: string
          hazard_type?: string | null
          id?: number
          typical_process?: string | null
        }
        Update: {
          hazard_name?: string
          hazard_type?: string | null
          id?: number
          typical_process?: string | null
        }
        Relationships: []
      }
      log_entries: {
        Row: {
          branch_id: string
          created_at: string
          data: Json
          id: string
          log_name: string
          organization_id: string
          process_step: string | null
          recorded_by: string | null
          status: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          data?: Json
          id?: string
          log_name: string
          organization_id: string
          process_step?: string | null
          recorded_by?: string | null
          status?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          data?: Json
          id?: string
          log_name?: string
          organization_id?: string
          process_step?: string | null
          recorded_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      logs_structure: {
        Row: {
          field_name: string
          id: number
          log_name: string
          related_process_step: string | null
        }
        Insert: {
          field_name: string
          id?: number
          log_name: string
          related_process_step?: string | null
        }
        Update: {
          field_name?: string
          id?: number
          log_name?: string
          related_process_step?: string | null
        }
        Relationships: []
      }
      logs_structure_manufacturing: {
        Row: {
          frequency: string | null
          id: number
          log_name: string
          parameter: string | null
          process_step_id: number
          record_type: string | null
          unit: string | null
        }
        Insert: {
          frequency?: string | null
          id?: number
          log_name: string
          parameter?: string | null
          process_step_id: number
          record_type?: string | null
          unit?: string | null
        }
        Update: {
          frequency?: string | null
          id?: number
          log_name?: string
          parameter?: string | null
          process_step_id?: number
          record_type?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          subscription_plan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          subscription_plan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          subscription_plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      process_hazard_map: {
        Row: {
          hazard: string
          id: number
          process: string
        }
        Insert: {
          hazard: string
          id?: number
          process: string
        }
        Update: {
          hazard?: string
          id?: number
          process?: string
        }
        Relationships: []
      }
      process_step_hazard_map: {
        Row: {
          hazard_id: number
          id: number
          process_step_id: number
        }
        Insert: {
          hazard_id: number
          id?: number
          process_step_id: number
        }
        Update: {
          hazard_id?: number
          id?: number
          process_step_id?: number
        }
        Relationships: []
      }
      process_steps: {
        Row: {
          id: number
          metadata: Json | null
          process_name: string
          step_type: string | null
        }
        Insert: {
          id?: number
          metadata?: Json | null
          process_name: string
          step_type?: string | null
        }
        Update: {
          id?: number
          metadata?: Json | null
          process_name?: string
          step_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prp_programs: {
        Row: {
          activity: string
          description: string | null
          frequency: string | null
          id: number
          program_name: string
          responsible: string | null
        }
        Insert: {
          activity: string
          description?: string | null
          frequency?: string | null
          id?: number
          program_name: string
          responsible?: string | null
        }
        Update: {
          activity?: string
          description?: string | null
          frequency?: string | null
          id?: number
          program_name?: string
          responsible?: string | null
        }
        Relationships: []
      }
      prp_records: {
        Row: {
          branch_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          organization_id: string
          program_name: string
          recorded_by: string | null
          status: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          organization_id: string
          program_name: string
          recorded_by?: string | null
          status?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          program_name?: string
          recorded_by?: string | null
          status?: string
        }
        Relationships: []
      }
      sop_library: {
        Row: {
          id: number
          procedure_text: string | null
          process_step: string
          responsible: string | null
          sop_title: string
        }
        Insert: {
          id?: number
          procedure_text?: string | null
          process_step: string
          responsible?: string | null
          sop_title: string
        }
        Update: {
          id?: number
          procedure_text?: string | null
          process_step?: string
          responsible?: string | null
          sop_title?: string
        }
        Relationships: []
      }
      sop_library_manufacturing: {
        Row: {
          activity_type: string | null
          description: string | null
          id: number
          process_step_id: number
          sop_name: string
        }
        Insert: {
          activity_type?: string | null
          description?: string | null
          id?: number
          process_step_id: number
          sop_name: string
        }
        Update: {
          activity_type?: string | null
          description?: string | null
          id?: number
          process_step_id?: number
          sop_name?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          description: string | null
          id: number
          industry_scope: string | null
          template_name: string
        }
        Insert: {
          description?: string | null
          id?: number
          industry_scope?: string | null
          template_name: string
        }
        Update: {
          description?: string | null
          id?: number
          industry_scope?: string | null
          template_name?: string
        }
        Relationships: []
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
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_organization: {
        Args: { _full_name: string; _org_name: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "Owner" | "Manager" | "QA" | "Staff" | "Auditor"
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
      app_role: ["Owner", "Manager", "QA", "Staff", "Auditor"],
    },
  },
} as const
