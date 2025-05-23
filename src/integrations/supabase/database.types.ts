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
      ai_voice_training: {
        Row: {
          id: string
          training_ref_id: string
          training_text: string
          voice_gender: 'male' | 'female'
          notes: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          training_ref_id: string
          training_text: string
          voice_gender: 'male' | 'female'
          notes?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          training_ref_id?: string
          training_text?: string
          voice_gender?: 'male' | 'female'
          notes?: string | null
          user_id?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          user_id: string
          user_ref_id: string
          name: string
          email: string
          phone_number: string | null
          pin: string
          role: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_ref_id: string
          name: string
          email: string
          phone_number?: string | null
          pin: string
          role: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_ref_id?: string
          name?: string
          email?: string
          phone_number?: string | null
          pin?: string
          role?: string
          is_active?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          organization_name: string | null
          has_subscription: boolean
        }
        Insert: {
          id: string
          name: string
          organization_name?: string | null
          has_subscription?: boolean
        }
        Update: {
          id?: string
          name?: string
          organization_name?: string | null
          has_subscription?: boolean
        }
      }
      model_training: {
        Row: {
          id: string
          model_ref_id: string
          model_name: string
          provider: string
          model_type: string
          system_prompt: string
          first_message: string
          temperature: number
          max_tokens: number
          files: string[] | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          model_ref_id: string
          model_name: string
          provider: string
          model_type: string
          system_prompt: string
          first_message: string
          temperature: number
          max_tokens: number
          files?: string[] | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          model_ref_id?: string
          model_name?: string
          provider?: string
          model_type?: string
          system_prompt?: string
          first_message?: string
          temperature?: number
          max_tokens?: number
          files?: string[] | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_next_user_sequence: {
        Args: Record<string, never>
        Returns: number
      }
      get_next_ai_training_sequence: {
        Args: Record<string, never>
        Returns: number
      }
      get_next_model_training_sequence: {
        Args: Record<string, never>
        Returns: number
      }
    }
  }
}
