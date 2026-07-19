export interface Strip {
  id: string;
  session_id: string;
  image_url: string;
  storage_path: string | null;
  theme: string;
  filter: string;
  caption: string | null;
  is_public: boolean;
  view_count: number;
  download_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  strip_id: string | null;
  name: string | null;
  message: string;
  created_at: string;
}
