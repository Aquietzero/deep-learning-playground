import * as _ from 'lodash'
import { Environment } from '../environment'
import { ID, LearningOpts } from '../types'
import {
  decaySchedule,
  full,
  argmax,
  argmax2,
  nArrayReduce,
  choice,
} from '../utils'

interface TrajectorySamplingOpts extends LearningOpts {
  maxTrajectoryDepth: number
}

export const trajectorySampling = (
  env: Environment,
  opts?: TrajectorySamplingOpts
) => {
  const {
    gamma = 1.0,
    initAlpha = 0.5,
    minAlpha = 0.01,
    alphaDecayRatio = 0.5,
    initEpsilon = 1.0,
    minEpsilon = 0.1,
    epsilonDecayRatio = 0.9,
    maxTrajectoryDepth = 10,
    nEpisodes = 3000,
  } = opts || {}

  const nS = _.size(env.mdp.states)
  const nA = _.size(env.mdp.actionSpace)

  const piTrack: any = []
  const Q: any = full([nS, nA])
  const QTrack = full([nEpisodes, nS, nA])

  // keep track of the transition function
  const TCount = full([nS, nA, nS])
  // keep track of the reward signal
  const RModel = full([nS, nA, nS])
  const visitedStates = new Set()
  const takenActionsByState: any = {} // { [state]: [taken actions] }

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

    while (true) {
      const action = selectAction(state, Q, epsilons[episode])
      const { reward, nextState, done } = <
        { reward: number; nextState: number; done: boolean }
      >env.step(action)

      // record the transition
      TCount[state][action][nextState] += 1
      visitedStates.add(state)
      takenActionsByState[state] = takenActionsByState[state] || new Set()
      takenActionsByState[state].add(action)

      // calculate an incremental mean of the reward signal
      const rDiff = reward - RModel[state][action][nextState]
      // then use the difference and the transition count to learn the reward signal
      RModel[state][action][nextState] +=
        rDiff / TCount[state][action][nextState]

      const notDone = !done ? 1 : 0
      const tdTarget =
        reward + gamma * _.max(Q[nextState] as number[]) * notDone
      const tdError = tdTarget - Q[state][action]
      Q[state][action] += alphas[episode] * tdError

      // all of the declarations below are local variables
      // so no effects take on the above variables with same names
      let trajectoryState = state
      for (let i = 0; i < maxTrajectoryDepth; ++i) {
        const sumQ = nArrayReduce(Q, (sum: number, val: number) => sum + val, 0)
        if (sumQ === 0) break

        // on-policy
        // const action = selectAction(trajectoryState, Q, epsilons[episode])
        // off-policy
        const action = argmax(Q[trajectoryState])

        const sum = _.sum(TCount[state][action])
        // haven't experience the transition, planning would be a mass
        if (!sum) break

        const probs = _.map(TCount[state][action], (v) => v / sum)
        const nextState = choice(probs)

        const reward = RModel[state][action][nextState]
        const tdTarget = reward + gamma * _.max(Q[nextState] as number[])
        const tdError = tdTarget - Q[state][action]

        // update Q-function with the simulated experience
        Q[state][action] += alphas[episode] * tdError

        trajectoryState = nextState
      }

      if (done) break

      state = nextState
    }

    QTrack[episode] = _.cloneDeep(Q)
    piTrack.push(argmax2(Q))
  })

  const V = _.map(Q, _.max)
  const pi = (state: ID) => (argmax2(Q) as any)[state]

  return { Q, V, pi, QTrack, piTrack }
}
