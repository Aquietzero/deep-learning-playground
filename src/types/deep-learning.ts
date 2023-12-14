
export interface EnvParams {
  size: number,
  pits: number,
  mode: 'static' | 'random',
}

export interface TrainParams {
  epochs: number
  learning_rate: number
  batch_size: number
  gamma: number
  spsilon: number
}

export interface TestParams {
  episodes: number
}

export interface TrainConfig {
  model_name: string,
  env_params: EnvParams,
  train_params: TrainParams,
}

export interface TestConfig {
  model_name: string,
  env_params: EnvParams,
  test_params: TestParams,
}