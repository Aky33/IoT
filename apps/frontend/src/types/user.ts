export type User = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  notes?: string;
};

export type UserFormValues = {
  firstName: string;
  lastName: string;
  notes?: string;
};
