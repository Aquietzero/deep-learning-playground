import * as _ from 'lodash'
import { Environment } from '../environment'
import { ID, LearningOpts } from '../types'
import { decaySchedule, logspace, full, argmax, argmax2 } from '../utils'
import { generateTrajectory } from './utils'

interface MCLearningOpts extends LearningOpts {
  maxSteps: number
  firstVisit: boolean
}

// Monte Carlo control method.
// alpha: learning rate
// epsilon: exploration rate
export const mc = (env: Environment, opts?: MCLearningOpts) => {
  const {
    gamma = 1.0,
    initAlpha = 0.5,
    minAlpha = 0.01,
    alphaDecayRatio = 0.5,
    initEpsilon = 1.0,
    minEpsilon = 0.1,
    epsilonDecayRatio = 0.9,
    nEpisodes = 3000,
    maxSteps = 200,
    firstVisit = true,
  } = opts || {}

  const nS = _.size(env.mdp.states)
  const nA = _.size(env.mdp.actionSpace)

  const discounts = logspace(0, maxSteps, maxSteps, gamma, false)
  const alphas = decaySchedule(initAlpha, minAlpha, alphaDecayRatio, nEpisodes)
  const epsilons = decaySchedule(
    initEpsilon,
    minEpsilon,
    epsilonDecayRatio,
    nEpisodes
  )

  const piTrack: any = []
  const Q = full([nS, nA], 0)
  const QTrack = full([nEpisodes, nS, nA])

  const selectAction = (state: ID, Q: any, epsilon: number) => {
    if (Math.random() > epsilon) return argmax(Q[state])
    return _.sample(_.range(nA))
  }

  _.times(nEpisodes, (episode) => {
    const trajectory = generateTrajectory(
      selectAction,
      Q,
      epsilons[episode],
      env,
      maxSteps
    )
    const visited = full([nS, nA], false)

    _.each(trajectory, (experience, t) => {
      const { state, action } = experience
      if (visited[state][action] && firstVisit) return
      visited[state][action] = true

      const nSteps = trajectory.length - t
      const G = _.sum(
        _.map(discounts.slice(0, nSteps), (discount, i) => {
          return discount * trajectory[t + i].reward
        })
      )
      Q[state][action] += alphas[episode] * (G - Q[state][action])
    })

    QTrack[episode] = _.cloneDeep(Q)
    piTrack.push(argmax2(Q))
  })

  const V = _.map(Q, _.max)
  const pi = (state: ID) => (argmax2(Q) as any)[state]

  return { Q, V, pi, QTrack, piTrack }
}
