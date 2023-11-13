import * as _ from 'lodash'
import {
  full,
  clip,
  argmax,
  logspace,
  pad,
  choice,
  randomNormal,
} from './utils'
import { Environment } from './environment'
import { TrainContext } from './types'

type Q_VALUE = [actionId: number, value: number]

const exploitation = () => {
  return (ctx: TrainContext) => {
    const { Q } = ctx
    return argmax(Q)
  }
}

const exploration = () => {
  return (ctx: TrainContext) => {
    const { Q } = ctx
    return _.random(0, Q.length - 1, false)
  }
}

const epsilonGreedy = (epsilon: number = 0.01) => {
  const exploitationStrategy = exploitation()
  const explorationStrategy = exploration()

  return (ctx: TrainContext) => {
    const { Q } = ctx
    if (Math.random() > epsilon) {
      return exploitationStrategy(ctx)
    } else {
      return explorationStrategy(ctx)
    }
  }
}

const linearlyDecayingEpsilonGreedy = (
  initEpsilon: number = 1.0,
  minEpsilon: number = 0.01,
  decayRatio: number = 0.05
) => {
  const exploitationStrategy = exploitation()
  const explorationStrategy = exploration()

  return (ctx: TrainContext) => {
    const { episode, nEpisodes, Q } = ctx
    const decayEpisodes = Math.floor(nEpisodes * decayRatio)
    let epsilon =
      minEpsilon + (initEpsilon - minEpsilon) * (1 - episode / decayEpisodes)
    epsilon = clip(epsilon, minEpsilon, initEpsilon)

    if (Math.random() > epsilon) {
      return exploitationStrategy(ctx)
    } else {
      return explorationStrategy(ctx)
    }
  }
}

const expDecayingEpsilonGreedy = (
  nEpisodes: number = 5000,
  initEpsilon: number = 1.0,
  minEpsilon: number = 0.01,
  decayRatio: number = 0.1
) => {
  const exploitationStrategy = exploitation()
  const explorationStrategy = exploration()

  // generate all epsilons
  const decayEpisodes = Math.floor(nEpisodes * decayRatio)
  const remEpisodes = nEpisodes - decayEpisodes
  const logs = logspace(-2, 0, decayEpisodes)
  let epsilons = _.map(logs, (val) => {
    return minEpsilon + (0.01 / val) * (initEpsilon - minEpsilon)
  })
  epsilons = pad(epsilons, [0, remEpisodes], 'edge')

  return (ctx: TrainContext) => {
    const { episode, Q } = ctx
    if (Math.random() > epsilons[episode]) {
      return exploitationStrategy(ctx)
    } else {
      return explorationStrategy(ctx)
    }
  }
}

const softmax = (
  initTemp: number = 1000.0,
  minTemp: number = 0.01,
  decayRatio: number = 0.04
) => {
  return (ctx: TrainContext) => {
    const { nEpisodes, episode, Q } = ctx
    // calculating the decaying temperature
    const decayEpisodes = Math.floor(nEpisodes * decayRatio)
    let temp = minTemp + (initTemp - minTemp) * (1 - episode / decayEpisodes)
    temp = clip(temp, minTemp, initTemp)

    const scaledQ = _.map(Q, (q) => q / temp)
    const maxQ = _.max(scaledQ)
    const normQ = _.map(scaledQ, (q) => q - maxQ)
    const expQ = _.map(normQ, Math.exp)
    const sumQ = _.sum(expQ)
    const probs = _.map(expQ, (q) => q / sumQ)
    return choice(probs)
  }
}

const upperConfidenceBound = (c: number = 2) => {
  return (ctx: TrainContext) => {
    const { episode, Q, N } = ctx
    let action: number,
      U: any = []

    if (episode < Q.length) {
      action = episode
    } else {
      U = _.map(N, (n) => Math.sqrt((c * Math.log(episode)) / n))
      const bounds = _.map(Q, (q, index) => q + U[index])
      action = argmax(bounds)
    }

    return action
  }
}

const thompsonSampling = (alpha: number = 1, beta: number = 0) => {
  return (ctx: TrainContext) => {
    const { Q, N } = ctx

    const samples = _.map(Q, (q, index) => {
      const n = N[index]
      return randomNormal(q, alpha / (Math.sqrt(n) + beta))
    })
    const action = clip(argmax(samples), 0, Q.length)
    return action
  }
}

const optimisticInitialization = (
  optimisticEstimate: number = 1.0,
  initialCount: number = 100
) => {
  return (env: Environment) => {
    const Q = full(env.actionSpace.length, optimisticEstimate)
    const N = full(env.actionSpace.length, initialCount)
    return { Q, N }
  }
}

export const STRATEGY = {
  OPTIMISTIC_INITIALIZATION: optimisticInitialization,

  EXPLOITATION: exploitation,
  EXPLORATION: exploration,
  EPSILON_GREEDY: epsilonGreedy,
  LINEARLY_DECAYING_EPSILON_GREEDY: linearlyDecayingEpsilonGreedy,
  EXP_DECAYING_EPSILON_GREEDY: expDecayingEpsilonGreedy,
  SOFTMAX: softmax,
  UPPER_CONFIDENCE_BOUND: upperConfidenceBound,
  THOMPSON_SAMPLING: thompsonSampling,
}
