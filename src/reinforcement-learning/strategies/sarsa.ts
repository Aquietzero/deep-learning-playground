import * as _ from 'lodash'
import { Environment } from '../environment'
import { ID, LearningOpts } from '../types'
import { decaySchedule, full, argmax, argmax2 } from '../utils'

interface SARSAOpts extends LearningOpts {}

// SARSA control method.
// alpha: learning rate
// epsilon: exploration rate
export const sarsa = (env: Environment, opts?: SARSAOpts) => {
  const {
    gamma = 1.0,
    initAlpha = 0.5,
    minAlpha = 0.01,
    alphaDecayRatio = 0.5,
    initEpsilon = 1.0,
    minEpsilon = 0.1,
    epsilonDecayRatio = 0.9,
    nEpisodes = 3000,
  } = opts

  const nS = _.size(env.mdp.states)
  const nA = _.size(env.mdp.actionSpace)

  const piTrack: any = []
  const Q = full([nS, nA])
  const QTrack = full([nEpisodes, nS, nA])

  const alphas = decaySchedule(initAlpha, minAlpha, alphaDecayRatio, nEpisodes)
  const epsilons = decaySchedule(
    initEpsilon,
    minEpsilon,
    epsilonDecayRatio,
    nEpisodes
  )

  const selectAction = (state: ID, Q: any, epsilon: number) => {
    if (Math.random() > epsilon) return argmax(Q[state])
    return _.sample(_.range(nA))
  }

  _.times(nEpisodes, (episode) => {
    env.reset()
    let state = env.currentState as number
    let action = selectAction(state, Q, epsilons[episode])

    while (true) {
      const { reward, nextState, done } = <
        { reward: number; nextState: number; done: boolean }
      >env.step(action)
      const nextAction = selectAction(nextState, Q, epsilons[episode])
      const notDone = !done ? 1 : 0
      const tdTarget = reward + gamma * Q[nextState][nextAction] * notDone
      const tdError = tdTarget - Q[state][action]
      Q[state][action] += alphas[episode] * tdError

      if (done) break

      state = nextState
      action = nextAction
    }

    QTrack[episode] = _.cloneDeep(Q)
    piTrack.push(argmax2(Q))
  })

  const V = _.map(Q, _.max)
  const pi = (state: ID) => (argmax2(Q) as any)[state]

  return { Q, V, pi, QTrack, piTrack }
}
