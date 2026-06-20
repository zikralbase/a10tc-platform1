export interface Database {
  public: {
    Tables: {
      registrations: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          email: string;
          telegram_username: string;
          academic_level: string;
          batch_selection: string;
          payment_reference: string;
          receipt_url: string;
          status: 'pending' | 'verified' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone_number: string;
          email: string;
          telegram_username: string;
          academic_level: string;
          batch_selection: string;
          payment_reference: string;
          receipt_url: string;
          status?: 'pending' | 'verified' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string;
          email?: string;
          telegram_username?: string;
          academic_level?: string;
          batch_selection?: string;
          payment_reference?: string;
          receipt_url?: string;
          status?: 'pending' | 'verified' | 'rejected';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}