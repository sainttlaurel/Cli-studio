export interface Strip {
  id: string;
  session_id: string;
  image_url: string;
  storage_path: string | null;
  theme: string;
  filter: string;
  caption: string | null;
  is_public: boolean;
  created_at: string;
}