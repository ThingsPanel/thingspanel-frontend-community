type productAdd = {
  additional_info?: string;
  description?: string;
  device_type?: string;
  image_url?: string | null;
  image?: any[];
  name: string;
  product_model?: string;
  product_type?: string;
  remark?: string;
  device_config_id?: string;
  product_key?: string;
};
interface productRecord extends productAdd {
  created_at: string;
  id: string;
}
type QueryFormModel = Pick<productRecord, 'name'> & {
  name?: string;
  product_model?: string;
  product_type?: string;
  page: number;
  page_size: number;
};

type productDeviceRecord = {
  deviceNumber: string;
  batchNumber: string;
  firmwareVersion: string;
  onlineDate: string;
  activeStatus: string;
  activeDate: string;
  id: string;
};
type productDeviceQueryParams = {
  deviceNumber: string;
  batchNumber: string;
};

type deviceAddType = {
  batch_file: string;
  batch_number: string;
  create_type: string;
  current_version: string;
  device_count?: any;
  product_id?: string;
};

type DeviceRegisterProps = {
  pid: string | number;
};

type PreproductDeviceRecord = {
  created_at: any;
  activate_flag: string;
  activate_at: any;
};
