import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface AIConfig {
  providerId: string
  apiKey: string
  model: string
}

interface SettingsState {
  aiConfigs: Record<string, AIConfig>
  selectedProvider: string
}

const initialState: SettingsState = {
  aiConfigs: {},
  selectedProvider: "openai",
}

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setAIConfig: (state, action: PayloadAction<AIConfig>) => {
      const { providerId, apiKey, model } = action.payload
      state.aiConfigs[providerId] = { providerId, apiKey, model }
    },
    removeAIConfig: (state, action: PayloadAction<string>) => {
      delete state.aiConfigs[action.payload]
    },
    setSelectedProvider: (state, action: PayloadAction<string>) => {
      state.selectedProvider = action.payload
    },
    // Legacy support for OpenAI key
    setOpenAIKey: (state, action: PayloadAction<string>) => {
      state.aiConfigs.openai = {
        providerId: "openai",
        apiKey: action.payload,
        model: "gpt-4o-mini",
      }
    },
    clearOpenAIKey: (state) => {
      delete state.aiConfigs.openai
    },
  },
})

export const { setAIConfig, removeAIConfig, setSelectedProvider, setOpenAIKey, clearOpenAIKey } = settingsSlice.actions
export default settingsSlice.reducer
