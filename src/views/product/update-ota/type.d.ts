type otaRecord = {
  id: number;
  name: string;
  ota_upgrade_package_id: string;
  description: string;
  created_at: number;
  remark: string;
  product_id: string;
};

type UpgradeTaskCreate = {
  description: string;
  name: string;
  ota_upgrade_package_id: string;
  remark: string;
  device_id_list: string[];
};

type UpgradeTaskList = {
  current_version: string | null;
  device_number: string;
  name: string;
  status: number;
  status_description: string | null;
  steps: number | null;
  updated_at: string;
  version: string;
  id: string;
};
type UpgradeTaskDetail = {
  current_version: string | null;
  device_number: string;
  name: string;
  status: number;
  status_description: null;
  steps: number | null;
  updated_at: string;
  version: string;
  id: string;
};
