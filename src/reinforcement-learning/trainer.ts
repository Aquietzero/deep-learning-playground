import * as fs from 'fs-extra'
import * as path from 'path'
import * as cliProgress from 'cli-progress'

import * as _ from 'lodash'
import { Action, TrainContext } from './types'
import { zeros, empty } from './utils'
import { Environment } from './environment'
import { BSW_MDP } from './mdps/bsw'
import { TwoArmedBandit_MDP } from './mdps/two-armed-bandit'
import { NArmedBandit_MDP } from './mdps/n-armed-bandit'
import { STRATEGY } from './strategy'
import { Strategy } from './types'

const strategies: Strategy[] = [
  { name: 'exploitation', run: STRATEGY.EXPLOITATION() },
  { name: 'exploration', run: STRATEGY.EXPLORATION() },
  { name: 'epsilon_greedy', run: STRATEGY.EPSILON_GREEDY(0.3) },
  {
    name: 'linearly_decaying_epsilon_greedy',
    run: STRATEGY.LINEARLY_DECAYING_EPSILON_GREEDY(),
  },
  {
    name: 'exp_decaying_epsilon_greedy',
    run: STRATEGY.EXP_DECAYING_EPSILON_GREEDY(),
  },
  {
    name: 'softmax',
    run: STRATEGY.SOFTMAX(),
  },
  {
    name: 'upper_confidence_bound',
    run: STRATEGY.UPPER_CONFIDENCE_BOUND(),
  },
  {
    name: 'thompson_sampling',
    run: STRATEGY.THOMPSON_SAMPLING(),
  },
  {
    name: 'optimistic_initialization',
    initialize: STRATEGY.OPTIMISTIC_INITIALIZATION(),
    run: STRATEGY.EXPLOITATION(),
  },
]

export const learn = (
  env: Environment,
  nEpisodes: number = 5000,
  strategy: Strategy = strategies[0],
  resultDir: string = ''
) => {
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  )
  progressBar.start(1, 0)

  // Q-function and the count array
  let Q: any, N: any
  if (strategy.initialize) {
    ;({ Q, N } = strategy.initialize(env))
  } else {
    Q = zeros(env.actionSpace.length)
    N = zeros(env.actionSpace.length)
  }

  // statistics
  const Qe = empty(nEpisodes, env.actionSpace.length)
  const returns = empty(nEpisodes)
  const actions = empty(nEpisodes)

  const name = 'Pure exploitation'

  let cummulatedReward = 0
  const meanEpisodeReward: number[] = []

  _.times(nEpisodes, (e) => {
    // each episode has only one action, so before each episode,
    // env has to be reset to the start state
    env.reset()

    const trainContext: TrainContext = {
      nEpisodes,
      episode: e,
      Q,
      N,
    }

    const action = strategy.run(trainContext)
    const { reward } = env.step(action)
    N[action] += 1
    Q[action] = Q[action] + (reward - Q[action]) / N[action]
    Qe[e] = Q
    returns[e] = reward
    actions[e] = action

    if (reward) {
      cummulatedReward += reward
    }
    meanEpisodeReward.push(cummulatedReward / (e + 1))

    progressBar.update((e + 1) / nEpisodes)
  })

  const dir = path.join(__dirname, '../../assets/RL-results', resultDir)

  fs.ensureDirSync(dir)
  fs.writeFileSync(
    path.join(dir, `mean-episode-reward-with-${strategy.name}.json`),
    JSON.stringify(meanEpisodeReward)
  )

  progressBar.stop()

  return { name, returns, Qe, actions }
}

// const env = new Environment(new BSW_MDP())
// const env = new Environment(new TwoArmedBandit_MDP())
const env = new Environment(new NArmedBandit_MDP())
_.each(strategies, (strategy) => {
  console.log(`learning with ${strategy.name}`)
  learn(env, 5000, strategy, 'n-armed-bandit')
})
