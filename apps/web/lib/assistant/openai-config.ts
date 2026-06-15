const defaultAssistantModel = "gpt-4.1-mini";

export type AssistantOpenAIConfig = {
  apiKey: string | null;
  model: string;
  isConfigured: boolean;
};

export const getAssistantOpenAIConfig = (): AssistantOpenAIConfig => {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || null;
  const model = process.env.OPENAI_MODEL?.trim() || defaultAssistantModel;

  return {
    apiKey,
    model,
    isConfigured: Boolean(apiKey),
  };
};
