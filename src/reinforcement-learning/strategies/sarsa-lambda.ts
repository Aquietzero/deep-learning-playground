import * as _ from 'lodash'
import { Environment } from '../environment'
import { ID, LearningOpts } from '../types'
import {
  decaySchedule,
  full,
  argmax,
  argmax2,
  clip,
  nArrayMap,
  nArrayScale,
} from '../utils'

interface SARSALambdaOpts extends LearningOpts {
  lambda: number
  replacingTraces: boolean
}

export const sarsaLambda = (env: Environment, opts?: SARSALambdaOpts) => {
  const {
    gamma = 1.0,
    initAlpha = 0.5,
    minAlpha = 0.01,
    alphaDecayRatio = 0.5,
    initEpsilon = 1.0,
    minEpsilon = 0.1,
    epsilonDecayRatio = 0.9,
    lambda = 0.5,
    replacingTraces = true,
    nEpisodes = 3000,
  } = opts

  const nS = _.size(env.mdp.states)
  const nA = _.size(env.mdp.actionSpace)

  const piTrack: any = []
  let Q = full([nS, nA])
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
    // eligibility traces to keep track of states eligible for updates.
    let E = full([nS, nA])

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

      // increment the state-action pair trace, clip it to 1 if it's
      // a replacing trace
      E[state][action] += 1
      if (replacingTraces) {
        E[state][action] = clip(E[state][action], 0, 1)
      }

      Q = nArrayMap(
        Q,
        E,
        (q: number, e: number) => q + alphas[episode] * tdError * e
      )
      E = nArrayScale(E, gamma * lambda)

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
