export interface BEdConceptResponse {
  concept: string;
  english_definition: string;
  tamil_definition: string;
  real_world_explainer: string;
  keywords: string[];
}

export interface ApiResponse {
  success: boolean;
  data?: BEdConceptResponse;
  message?: string;
}