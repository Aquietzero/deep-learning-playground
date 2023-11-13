import * as _ from 'lodash'
import { Environment } from '../environment'
import { ID, LearningOpts } from '../types'
import { decaySchedule, full, argmax, argmax2, nArrayMap } from '../utils'

interface DoubleQOpts extends LearningOpts {}

export const doubleQ = (env: Environment, opts?: DoubleQOpts) => {
  const {
    gamma = 1.0,
    initAlpha = 0.5,
    minAlpha = 0.01,
    alphaDecayRatio = 0.5,
    initEpsilon = 1.0,
    minEpsilon = 0.1,
    epsilonDecayRatio = 0.9,
    nEpisodes = 3000,
  } = opts || {}

  const nS = _.size(env.mdp.states)
  const nA = _.size(env.mdp.actionSpace)

  const piTrack: any = []
  const Q1: any = full([nS, nA])
  const Q2: any = full([nS, nA])
  const Q1Track = full([nEpisodes, nS, nA])
  const Q2Track = full([nEpisodes, nS, nA])

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

  const avg = (v1: number, v2: number) => (v1 + v2) / 2

  _.times(nEpisodes, (episode) => {
    env.reset()
    let state = env.currentState as number

    while (true) {
      const action = selectAction(
        state,
        nArrayMap(Q1, Q2, avg),
        epsilons[episode]
      )
      const { reward, nextState, done } = <
        { reward: number; nextState: number; done: boolean }
      >env.step(action)
      const notDone = !done ? 1 : 0

      if (Math.random() < 0.5) {
        const argmaxQ1 = argmax(Q1[nextState])
        const tdTarget = reward + gamma * Q2[nextState][argmaxQ1] * notDone
        const tdError = tdTarget - Q1[state][action]
        Q1[state][action] += alphas[episode] * tdError
      } else {
        const argmaxQ2 = argmax(Q2[nextState])
        const tdTarget = reward + gamma * Q1[nextState][argmaxQ2] * notDone
        const tdError = tdTarget - Q2[state][action]
        Q2[state][action] += alphas[episode] * tdError
      }

      if (done) break

      state = nextState
    }

    Q1Track[episode] = _.cloneDeep(Q1)
    Q2Track[episode] = _.cloneDeep(Q2)
    piTrack.push(argmax2(nArrayMap(Q1, Q2, avg)))
  })

  const Q = nArrayMap(Q1, Q2, avg)
  const V = _.map(Q, _.max)
  const pi = (state: ID) => (argmax2(Q) as any)[state]
  const QTrack = nArrayMap(Q1Track, Q2Track, avg)

  return { Q, V, pi, QTrack, piTrack }
}
