// Generated types for Supabase database
// TODO: Replace with actual generated types from Supabase CLI: `supabase gen types typescript`
// For now, using manual types that match our interfaces

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      galaxies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          tick: number;
          status: 'lobby' | 'active' | 'paused' | 'finished';
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          tick?: number;
          status?: 'lobby' | 'active' | 'paused' | 'finished';
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          tick?: number;
          status?: 'lobby' | 'active' | 'paused' | 'finished';
        };
      };
      systems: {
        Row: {
          id: string;
          galaxy_id: string;
          name: string;
          x: number;
          y: number;
          star_type: 'red_dwarf' | 'yellow' | 'blue_giant' | 'white_dwarf';
          planets: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          galaxy_id: string;
          name: string;
          x: number;
          y: number;
          star_type: 'red_dwarf' | 'yellow' | 'blue_giant' | 'white_dwarf';
          planets: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          galaxy_id?: string;
          name?: string;
          x?: number;
          y?: number;
          star_type?: 'red_dwarf' | 'yellow' | 'blue_giant' | 'white_dwarf';
          planets?: number;
          created_at?: string;
        };
      };
      lanes: {
        Row: {
          id: string;
          galaxy_id: string;
          from_system_id: string;
          to_system_id: string;
          distance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          galaxy_id: string;
          from_system_id: string;
          to_system_id: string;
          distance: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          galaxy_id?: string;
          from_system_id?: string;
          to_system_id?: string;
          distance?: number;
          created_at?: string;
        };
      };
      ownership: {
        Row: {
          id: string;
          system_id: string;
          player_id: string;
          captured_at: string;
        };
        Insert: {
          id?: string;
          system_id: string;
          player_id: string;
          captured_at?: string;
        };
        Update: {
          id?: string;
          system_id?: string;
          player_id?: string;
          captured_at?: string;
        };
      };
      fleets: {
        Row: {
          id: string;
          player_id: string;
          system_id: string;
          name: string;
          ships: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          system_id: string;
          name: string;
          ships: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          system_id?: string;
          name?: string;
          ships?: number;
          created_at?: string;
        };
      };
      player_states: {
        Row: {
          id: string;
          player_id: string;
          galaxy_id: string;
          empire_name: string;
          color: string;
          ready: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          galaxy_id: string;
          empire_name: string;
          color: string;
          ready?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          galaxy_id?: string;
          empire_name?: string;
          color?: string;
          ready?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          player_id: string;
          galaxy_id: string;
          order_type: 'MOVE_FLEET';
          tick: number;
          payload: Json;
          status: 'pending' | 'processed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          galaxy_id: string;
          order_type: 'MOVE_FLEET';
          tick: number;
          payload: Json;
          status?: 'pending' | 'processed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          galaxy_id?: string;
          order_type?: 'MOVE_FLEET';
          tick?: number;
          payload?: Json;
          status?: 'pending' | 'processed' | 'failed';
          created_at?: string;
        };
      };
    };
  };
}
