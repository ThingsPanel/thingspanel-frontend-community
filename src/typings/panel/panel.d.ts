declare namespace Panel {
  interface Board {
    id?: string;
    name?: string;
    config?: null;
    tenant_id?: string;
    created_at?: string;
    updated_at?: string;
    home_flag?: string;
    description?: string;
    remark?: string;
    menu_flag?: string;
  }

  interface Data {
    list: Board[];
    total: number;
  }

  interface ApiResponse {
    code: number;
    message: string;
    data: Data | null;
  }

  interface RequestParams {
    home_flag?: 'Y' | 'N';
    name?: string;
    page: number;
    page_size: number;
  }
}
