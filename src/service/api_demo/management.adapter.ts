export function adapterOfFetchUserList(data: Api.UserManagement.User[] | null): Api.UserManagement.User[] {
  if (!data) return [];

  return data.map(item => {
    const user: Api.UserManagement.User = {
      ...item
    };
    return user;
  });
}

export function adapterOfAddIndex(data: any) {
  if (!data) return [];

  return data.map((item: any, index: number) => {
    const rule: Api.RuleEngine.Rule = {
      index: index + 1,
      ...item
    };

    return rule;
  });
}
