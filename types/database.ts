export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      credits: {
        Row: {
          id: string
          user_id: string
          credits: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          user_id: string
          stripe_payment_id: string
          amount: number
          credits_granted: number
          status: string
          created_at: string
          credit_grant_id: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_id: string
          amount: number
          credits_granted: number
          status: string
          created_at?: string
          credit_grant_id: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_id?: string
          amount?: number
          credits_granted?: number
          status?: string
          created_at?: string
          credit_grant_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          id: string
          user_id: string
          image_url: string
          fal_output_url: string | null
          created_at: string
          status: string
          credit_used: boolean
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          fal_output_url?: string | null
          created_at?: string
          status: string
          credit_used?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          fal_output_url?: string | null
          created_at?: string
          status?: string
          credit_used?: boolean
        }
        Relationships: []
      }
      exports: {
        Row: {
          id: string
          user_id: string
          export_url: string
          text_content: string
          font_size: number
          font_color: string
          shadow: string | null
          position_x: number
          position_y: number
          upload_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          export_url: string
          text_content: string
          font_size: number
          font_color: string
          shadow?: string | null
          position_x: number
          position_y: number
          upload_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          export_url?: string
          text_content?: string
          font_size?: number
          font_color?: string
          shadow?: string | null
          position_x?: number
          position_y?: number
          upload_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      initialize_user_credits: {
        Args: {
          clerk_user_id: string
        }
        Returns: string
      }
      deduct_user_credits: {
        Args: {
          clerk_user_id: string
          amount: number
        }
        Returns: boolean
      }
      add_user_credits: {
        Args: {
          clerk_user_id: string
          amount: number
        }
        Returns: void
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