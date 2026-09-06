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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      experience: {
        Row: {
          company_name: string
          created_at: string
          date_end: string | null
          date_start: string | null
          display_order: number
          id: string
          image_url: string | null
          role_title: string
          role_type: string
          updated_at: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          role_title: string
          role_type?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          role_title?: string
          role_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          admin_reply: string | null
          content: string
          created_at: string
          id: string
          is_anonymous: boolean
          replied_at: string | null
          sender_name: string | null
          status: string
        }
        Insert: {
          admin_reply?: string | null
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          replied_at?: string | null
          sender_name?: string | null
          status?: string
        }
        Update: {
          admin_reply?: string | null
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          replied_at?: string | null
          sender_name?: string | null
          status?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          availability_text: string
          avatar_url: string | null
          connect_text: string
          cv_url: string | null
          email: string
          footer_copyright: string
          full_name: string
          id: number
          location: string
          resume_url: string | null
          social_github: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_whatsapp: string | null
          summary_paragraph: string
          title: string
          updated_at: string
        }
        Insert: {
          availability_text?: string
          avatar_url?: string | null
          connect_text?: string
          cv_url?: string | null
          email?: string
          footer_copyright?: string
          full_name?: string
          id?: number
          location?: string
          resume_url?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_whatsapp?: string | null
          summary_paragraph?: string
          title?: string
          updated_at?: string
        }
        Update: {
          availability_text?: string
          avatar_url?: string | null
          connect_text?: string
          cv_url?: string | null
          email?: string
          footer_copyright?: string
          full_name?: string
          id?: number
          location?: string
          resume_url?: string | null
          social_github?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_whatsapp?: string | null
          summary_paragraph?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_edit_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          project_id: string
          proposed_changes: Json
          requester_instagram: string
          requester_name: string
          requester_whatsapp: string | null
          reviewed_at: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          project_id: string
          proposed_changes: Json
          requester_instagram: string
          requester_name: string
          requester_whatsapp?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          project_id?: string
          proposed_changes?: Json
          requester_instagram?: string
          requester_name?: string
          requester_whatsapp?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_edit_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sections: {
        Row: {
          content: string
          created_at: string
          display_order: number
          id: string
          project_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          project_id: string
          title?: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          project_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          display_order: number
          project_id: string
          tag_id: string
        }
        Insert: {
          display_order?: number
          project_id: string
          tag_id: string
        }
        Update: {
          display_order?: number
          project_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          associated_with: string
          category: string
          contributors: string
          contributors_list: Json
          created_at: string
          date_end: string | null
          date_start: string | null
          display_order: number
          duration: string
          id: string
          is_featured: boolean
          is_published: boolean
          live_url: string | null
          meta_description: string | null
          meta_title: string | null
          role: string
          short_description: string
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          associated_with?: string
          category?: string
          contributors?: string
          contributors_list?: Json
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          display_order?: number
          duration?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          live_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          role?: string
          short_description?: string
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          associated_with?: string
          category?: string
          contributors?: string
          contributors_list?: Json
          created_at?: string
          date_end?: string | null
          date_start?: string | null
          display_order?: number
          duration?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          live_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          role?: string
          short_description?: string
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      stats: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          value: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          value?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          value?: number
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          label: string
        }
        Insert: {
          id?: string
          label: string
        }
        Update: {
          id?: string
          label?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          quote: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          quote: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          quote?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compact_project_sections: {
        Args: {
          deleted_order: number
          target_project_id: string
          target_type: string
        }
        Returns: undefined
      }
      compact_ranked_table: {
        Args: { deleted_order: number; target_table: string }
        Returns: undefined
      }
      reorder_project_section: {
        Args: { new_order: number; section_id: string }
        Returns: undefined
      }
      reorder_ranked_item: {
        Args: { new_order: number; target_id: string; target_table: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
