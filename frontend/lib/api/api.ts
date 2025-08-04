import { fetchData } from './fetchBase';
interface LoginData {
  email_id: string;
  password: string;
}
interface SignupData {
  email_id: string;
  full_name: string;
  phone_number: string;
  password: string;
}
interface User {
  id: string;
  email: string;
  name: string;
}
export const connect = {
  sync: async (): Promise<User> => {
    const response = await fetchData<User>({
      method: 'POST',
      url: '/sync',
    });
    return response.data;
  },
//   adminLogin: async (data: LoginData): Promise<User> => {
//     const response = await fetchData<User>({
//       method: 'POST',
//       url: '/admin/admin-login',
//       data,
//     });
//     return response.data;
//   },
//   signup: async (data: SignupData): Promise<User> => {
//     const response = await fetchData<User>({
//       method: 'POST',
//       url: '/auth/register',
//       data,
//     });
//     return response.data;
//   },
};