export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          id: string
          kind: string
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          kind: string
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: string
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          content_md: string
          created_at: string
          id: string
          part_title: string
          position: number
          published_at: string | null
          reading_minutes: number
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          story_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_md?: string
          created_at?: string
          id?: string
          part_title?: string
          position?: number
          published_at?: string | null
          reading_minutes?: number
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          story_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          part_title?: string
          position?: number
          published_at?: string | null
          reading_minutes?: number
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          story_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      course_links: {
        Row: {
          course_id: string
          linked_course_id: string
          position: number
          relation: string
        }
        Insert: {
          course_id: string
          linked_course_id: string
          position?: number
          relation: string
        }
        Update: {
          course_id?: string
          linked_course_id?: string
          position?: number
          relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_links_linked_course_id_fkey"
            columns: ["linked_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_alt: string
          cover_url: string | null
          created_at: string
          description_md: string
          featured: boolean
          id: string
          level: string
          position: number
          published_at: string | null
          search: unknown | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          topics: string[]
          updated_at: string
        }
        Insert: {
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          description_md?: string
          featured?: boolean
          id?: string
          level?: string
          position?: number
          published_at?: string | null
          search?: unknown | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title: string
          topics?: string[]
          updated_at?: string
        }
        Update: {
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          description_md?: string
          featured?: boolean
          id?: string
          level?: string
          position?: number
          published_at?: string | null
          search?: unknown | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title?: string
          topics?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          created_at: string
          end_date: string | null
          highlights: string[]
          id: string
          is_current: boolean
          kind: string
          location: string
          organization: string
          position: number
          start_date: string | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          highlights?: string[]
          id?: string
          is_current?: boolean
          kind: string
          location?: string
          organization?: string
          position?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          highlights?: string[]
          id?: string
          is_current?: boolean
          kind?: string
          location?: string
          organization?: string
          position?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      galleries: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          id: string
          position: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          position?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          position?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt: string
          caption: string
          created_at: string
          featured: boolean
          gallery_id: string
          height: number | null
          id: string
          made_on: string | null
          media_type: string
          media_url: string
          meta: Json
          position: number
          poster_url: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          title: string
          updated_at: string
          width: number | null
        }
        Insert: {
          alt?: string
          caption?: string
          created_at?: string
          featured?: boolean
          gallery_id: string
          height?: number | null
          id?: string
          made_on?: string | null
          media_type?: string
          media_url: string
          meta?: Json
          position?: number
          poster_url?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt?: string
          caption?: string
          created_at?: string
          featured?: boolean
          gallery_id?: string
          height?: number | null
          id?: string
          made_on?: string | null
          media_type?: string
          media_url?: string
          meta?: Json
          position?: number
          poster_url?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_md: string
          course_id: string
          created_at: string
          id: string
          position: number
          published_at: string | null
          reading_minutes: number
          search: unknown | null
          section_title: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_md?: string
          course_id: string
          created_at?: string
          id?: string
          position?: number
          published_at?: string | null
          reading_minutes?: number
          search?: unknown | null
          section_title?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_md?: string
          course_id?: string
          created_at?: string
          id?: string
          position?: number
          published_at?: string | null
          reading_minutes?: number
          search?: unknown | null
          section_title?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt: string
          created_at: string
          height: number | null
          id: string
          mime_type: string
          path: string
          size_bytes: number
          url: string
          width: number | null
        }
        Insert: {
          alt?: string
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string
          path: string
          size_bytes?: number
          url: string
          width?: number | null
        }
        Update: {
          alt?: string
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string
          path?: string
          size_bytes?: number
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          category_id: string | null
          content_md: string
          cover_alt: string
          cover_url: string | null
          created_at: string
          excerpt: string
          featured: boolean
          id: string
          published_at: string | null
          reading_minutes: number
          review: Json | null
          search: unknown | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content_md?: string
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          published_at?: string | null
          reading_minutes?: number
          review?: Json | null
          search?: unknown | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content_md?: string
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          id?: string
          published_at?: string | null
          reading_minutes?: number
          review?: Json | null
          search?: unknown | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category_id: string | null
          content_md: string
          cover_alt: string
          cover_url: string | null
          created_at: string
          ended_on: string | null
          featured: boolean
          gallery: Json
          id: string
          is_ongoing: boolean
          live_url: string | null
          position: number
          published_at: string | null
          reading_minutes: number
          repo_url: string | null
          role: string
          search: unknown | null
          slug: string
          started_on: string | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          tech: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content_md?: string
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          ended_on?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          is_ongoing?: boolean
          live_url?: string | null
          position?: number
          published_at?: string | null
          reading_minutes?: number
          repo_url?: string | null
          role?: string
          search?: unknown | null
          slug: string
          started_on?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          tech?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content_md?: string
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          ended_on?: string | null
          featured?: boolean
          gallery?: Json
          id?: string
          is_ongoing?: boolean
          live_url?: string | null
          position?: number
          published_at?: string | null
          reading_minutes?: number
          repo_url?: string | null
          role?: string
          search?: unknown | null
          slug?: string
          started_on?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          tech?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          abstract: string
          authors: string[]
          bibtex: string
          created_at: string
          doi: string | null
          featured: boolean
          id: string
          keywords: string[]
          kind: string
          pdf_url: string | null
          published_at: string | null
          published_on: string | null
          search: unknown | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          url: string | null
          venue: string
          year: number
        }
        Insert: {
          abstract?: string
          authors?: string[]
          bibtex?: string
          created_at?: string
          doi?: string | null
          featured?: boolean
          id?: string
          keywords?: string[]
          kind?: string
          pdf_url?: string | null
          published_at?: string | null
          published_on?: string | null
          search?: unknown | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          url?: string | null
          venue?: string
          year: number
        }
        Update: {
          abstract?: string
          authors?: string[]
          bibtex?: string
          created_at?: string
          doi?: string | null
          featured?: boolean
          id?: string
          keywords?: string[]
          kind?: string
          pdf_url?: string | null
          published_at?: string | null
          published_on?: string | null
          search?: unknown | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          url?: string | null
          venue?: string
          year?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          avatar_alt: string
          avatar_url: string | null
          bio_md: string
          email: string
          full_name: string
          headline: string
          home_copy: Json
          id: number
          interests: string[]
          intro: string
          location: string
          now_md: string
          og_image_url: string | null
          resume_url: string | null
          site_description: string
          site_title: string
          site_url: string
          skills: Json
          socials: Json
          updated_at: string
        }
        Insert: {
          avatar_alt?: string
          avatar_url?: string | null
          bio_md?: string
          email?: string
          full_name?: string
          headline?: string
          home_copy?: Json
          id?: number
          interests?: string[]
          intro?: string
          location?: string
          now_md?: string
          og_image_url?: string | null
          resume_url?: string | null
          site_description?: string
          site_title?: string
          site_url?: string
          skills?: Json
          socials?: Json
          updated_at?: string
        }
        Update: {
          avatar_alt?: string
          avatar_url?: string | null
          bio_md?: string
          email?: string
          full_name?: string
          headline?: string
          home_copy?: Json
          id?: number
          interests?: string[]
          intro?: string
          location?: string
          now_md?: string
          og_image_url?: string | null
          resume_url?: string | null
          site_description?: string
          site_title?: string
          site_url?: string
          skills?: Json
          socials?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          cover_alt: string
          cover_url: string | null
          created_at: string
          featured: boolean
          format: string
          genre: string
          id: string
          is_complete: boolean
          position: number
          published_at: string | null
          search: unknown | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          synopsis: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          format?: string
          genre?: string
          id?: string
          is_complete?: boolean
          position?: number
          published_at?: string | null
          search?: unknown | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          synopsis?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_alt?: string
          cover_url?: string | null
          created_at?: string
          featured?: boolean
          format?: string
          genre?: string
          id?: string
          is_complete?: boolean
          position?: number
          published_at?: string | null
          search?: unknown | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          synopsis?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      estimate_reading_minutes: {
        Args: { md: string }
        Returns: number
      }
      grant_admin: {
        Args: { target_email: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      search_site: {
        Args: { q: string; max_results?: number }
        Returns: {
          kind: string
          title: string
          summary: string
          url: string
          rank: number
        }[]
      }
    }
    Enums: {
      content_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_status: ["draft", "published", "archived"],
    },
  },
} as const

