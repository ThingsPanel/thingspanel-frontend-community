import { reactive, ref } from 'vue';
import { getUserList } from '@/service/api/notification';

const loading = ref(false);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  name: ''
});

export const initMemberData = { name: '', notificationType: [] };
export const memberTypeData = ref<any>([initMemberData]);

export const handleDeleteMember = (index: number) => {
  memberTypeData.value.splice(index, 1);
};

export const handleUpdateMember = (updateIndex: number, data: { name: string; notificationType: string[] }) => {
  const filterData = memberTypeData.value.map((item, index) => {
    if (index === updateIndex) {
      return {
        name: data.name,
        notificationType: data.notificationType
      };
    }
    return item;
  });
  memberTypeData.value = [...filterData];
};

export const notificationTypeOptions = ref<{ label: string; value: string }[]>([]);

export const handleSearch = (query?: string) => {
  loading.value = true;
  if (query && query !== pagination.name) {
    pagination.name = query || '';
    pagination.page = 1;
    notificationTypeOptions.value = [];
  }
  getUserList({
    page: pagination.page,
    page_size: pagination.pageSize,
    name: query || ''
  }).then(res => {
    if (res?.data) {
      const userList = res.data?.list || [];
      const formatList = userList.map(item => {
        return {
          label: item.name,
          value: item.id
        };
      });
      notificationTypeOptions.value = [...notificationTypeOptions.value, ...formatList];
    }
    loading.value = false;
  });
};

export const handleScroll = e => {
  const currentTarget = e.currentTarget as HTMLElement;
  if (currentTarget.scrollTop + currentTarget.offsetHeight >= currentTarget.scrollHeight) {
    pagination.page += 1;
    handleSearch();
  }
};

export const getCurrentName = (index: number) => {
  return memberTypeData.value[index].name;
};
