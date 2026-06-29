export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  display_name: string;
  file_url: string;
  parsed_text: string | null;
  is_default: boolean;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export type CreateResumeInput = Pick<
  Resume,
  "file_name" | "display_name" | "file_url" | "file_size"
>;
