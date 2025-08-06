import { setSelectedProvider } from '../slices/settingsSlice';
import { fetchData } from './fetchBase';

interface Sync {
  success: boolean;
}

interface GetModelInfo {
  id: string;
  model_id: string;
  name: string;
  model: string;
  api_key: string;
  success?: boolean;
  error?: string | null;
}

interface UserAiModal {
  model_id: string;
  name: string;
  api_key: string;
  model: string;
}

interface updateAiModal {
  name: string;
  model: string;
  api_key: string;
}

interface deleteUserAiModalResponse {
  success: boolean;
  message?: string;
  error?: string | null;
}

interface SelectModelRequest {
  model_id: string;
}

interface SelectModelResponse {
  id: string;
  user_id: string;
  model_id: string;
}
export const connect = {
  sync: async (): Promise<Sync> => {
    const response = await fetchData<Sync>({
      method: 'POST',
      url: '/sync',
    });
    return response.data;
  },
  getUserAiModals: async (): Promise<GetModelInfo[]> => {
    const response = await fetchData<GetModelInfo[]>({
      method: 'GET',
      url: '/ai-models',
    });
    return response.data;
  },
  createUserAiModal: async (data: UserAiModal): Promise<GetModelInfo | deleteUserAiModalResponse> => {
    const response = await fetchData<GetModelInfo | deleteUserAiModalResponse>({
      method: 'POST',
      url: '/ai-models',
      data,
    });
    console.log("createUserAiModal response", response);
    return response.data;
  },
  updateUserAiModal: async (modelId: string, data: updateAiModal): Promise<GetModelInfo> => {
    const response = await fetchData<GetModelInfo>({
      method: 'PATCH',
      url: `/ai-models/${modelId}`,
      data,
    });
    return response.data;
  },
  deleteUserAiModal: async (modelId: string): Promise<deleteUserAiModalResponse> => {
    const response = await fetchData<deleteUserAiModalResponse>({
      method: 'DELETE',
      url: `/models/${modelId}`,
    });
    return response.data;
  },
  setSelectedAiModel: async (data: SelectModelRequest): Promise<SelectModelResponse> => {
    const response = await fetchData<SelectModelResponse>({
      method: 'PUT',
      url: `/models/selected`,
      data,
    });
    return response.data;
  },

  getSelectedAiModel: async (): Promise<SelectModelResponse | null> => {
    try {
      const response = await fetchData<SelectModelResponse>({
        method: 'GET',
        url: `/models/selected/details`,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching selected AI model:", error);
      return null;
    }
  },
};