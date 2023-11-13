import * as fs from 'fs-extra'
import * as path from 'path'

import * as _ from 'lodash'
import { Environment } from './environment'
import { Policy, policyEvaluation } from './policy'
import { Experience } from './types'
import { decaySchedule, logspace, zeros, full, empty, dot } from './utils'
import { RandomWalk_MDP } from './mdps/random-wark'

export class StateValueEvaluator {
  generateTrajectory(pi: Policy, env: Environment, maxSteps: number = 20) {
    let counter = 0
    const trajectory: Experience[] = []

    env.reset()
    let state = env.currentState

    while (true) {
      if (counter > maxSteps) break

      const { actionIndex } = pi.takeAction(env.mdp.states[state])
      const { reward, nextState, done } = env.step(actionIndex)
      const experience = new Experience(
        state,
        actionIndex,
        reward,
        nextState,
        done
      )
      trajectory.push(experience)

      if (done) break

      state = nextState
      counter += 1
    }

    return trajectory
  }

  // Monte Carlo method implementation
  mcPrediction(
    pi: Policy,
    env: Environment,
    gamma: number = 1.0,
    initAlpha: number = 0.5,
    minAlpha: number = 0.01,
    alphaDecayRatio: number = 0.5,
    nEpisodes: number = 500,
    maxSteps: number = 200,
    firstVisit: boolean = true
  ) {
    const nS = _.size(env.mdp.states)
    const discounts = logspace(0, maxSteps, maxSteps, gamma, false)
    const alphas = decaySchedule(
      initAlpha,
      minAlpha,
      alphaDecayRatio,
      nEpisodes
    )

    const V = zeros(nS)
    const VTrack = empty(nEpisodes, nS)

    _.times(nEpisodes, (episode) => {
      const trajectory = this.generateTrajectory(pi, env, maxSteps)
      const visited = full(nS, false)
      _.each(trajectory, (experience, t) => {
        const { state } = <{ state: number }>experience
        if (visited[state] && firstVisit) return

        visited[state] = true
        // steps from current experience to the last
        const nSteps = trajectory.length - t

        const G = _.sum(
          _.map(discounts.slice(0, nSteps), (discount, i) => {
            return discount * trajectory[t + i].reward
          })
        )
        V[state] = V[state] + alphas[episode] * (G - V[state])
      })

      VTrack[episode] = [...V]
    })

    return { V, VTrack }
  }

  // temporal-difference method
  tdPrediction(
    pi: Policy,
    env: Environment,
    gamma: number = 1.0,
    initAlpha: number = 0.5,
    minAlpha: number = 0.01,
    alphaDecayRatio: number = 0.5,
    nEpisodes: number = 500
  ) {
    const nS = _.size(env.mdp.states)
    const alphas = decaySchedule(
      initAlpha,
      minAlpha,
      alphaDecayRatio,
      nEpisodes
    )

    const V = zeros(nS)
    const VTrack = empty(nEpisodes, nS)

    _.times(nEpisodes, (episode) => {
      env.reset()
      let state = env.currentState as number

      while (true) {
        const { actionIndex } = pi.takeAction(env.mdp.states[state])
        const { reward, nextState, done } = <
          { reward: number; nextState: number; done: boolean }
        >env.step(actionIndex)
        const notDone = !done ? 1 : 0
        const tdTarget = reward + gamma * V[nextState] * notDone
        const tdError = tdTarget - V[state]
        V[state] = V[state] + alphas[episode] * tdError

        if (done) break

        state = nextState
      }

      VTrack[episode] = [...V]
    })

    return { V, VTrack }
  }

  // n-step temporal-difference method
  ntdPrediction(
    pi: Policy,
    env: Environment,
    gamma: number = 1.0,
    initAlpha: number = 0.5,
    minAlpha: number = 0.01,
    alphaDecayRatio: number = 0.5,
    nStep: number = 3,
    nEpisodes: number = 500
  ) {
    const nS = _.size(env.mdp.states)
    const V = zeros(nS)
    const VTrack = empty(nEpisodes, nS)

    const alphas = decaySchedule(
      initAlpha,
      minAlpha,
      alphaDecayRatio,
      nEpisodes
    )
    const discounts = logspace(0, nStep + 1, nStep + 1, gamma, false)

    _.times(nEpisodes, (episode) => {
      env.reset()
      let state = env.currentState as number
      const nPath: Experience[] = []

      let reward,
        nextState: number,
        done = false

      while (true) {
        // pops the first experience
        nPath.shift()

        // collect small experience path with size of nStep
        // smaller if done is meet
        while (!done && nPath.length < nStep) {
          const { actionIndex } = pi.takeAction(env.mdp.states[state])
          const transition = env.step(actionIndex)
          reward = transition.reward
          nextState = transition.nextState as number
          done = transition.done
          nPath.push(
            new Experience(state, actionIndex, reward, nextState, done)
          )

          state = nextState
        }

        const estimateState: number = nPath[0].state as number
        const rewards = _.map(nPath, (experience) => experience.reward)
        const partialReturn = dot(discounts.slice(0, nPath.length), rewards)
        const notDone = !done ? 1 : 0
        const bootstrapValue = _.last(discounts) * V[nextState] * notDone
        const ntdTarget = partialReturn + bootstrapValue
        const ntdError = ntdTarget - V[estimateState]

        V[estimateState] = V[estimateState] + alphas[episode] * ntdError

        // break the episode loop if path has only one experience and the done
        // flag of the experience is true
        if (nPath.length === 1 && nPath[0].done) break
      }

      VTrack[episode] = [...V]
    })

    return { V, VTrack }
  }

  tdLambdaPrediction(
    pi: Policy,
    env: Environment,
    gamma: number = 1.0,
    initAlpha: number = 0.5,
    minAlpha: number = 0.01,
    alphaDecayRatio: number = 0.5,
    lambda: number = 0.3,
    nEpisodes: number = 500
  ) {
    const nS = _.size(env.mdp.states)
    const V = zeros(nS)
    const VTrack = empty(nEpisodes, nS)

    const alphas = decaySchedule(
      initAlpha,
      minAlpha,
      alphaDecayRatio,
      nEpisodes
    )

    _.times(nEpisodes, (episode) => {
      const E = zeros(nS)
      env.reset()
      let state = env.currentState as number

      while (true) {
        const { actionIndex } = pi.takeAction(env.mdp.states[state])
        const { reward, nextState, done } = <
          { reward: number; nextState: number; done: boolean }
        >env.step(actionIndex)
        const notDone = !done ? 1 : 0

        const tdTarget = reward + gamma * V[nextState] * notDone
        const tdError = tdTarget - V[state]
        E[state] = E[state] + 1
        _.each(V, (v, index) => {
          V[index] += alphas[episode] * tdError * E[index]
        })
        _.each(E, (e, index) => (E[index] = e * gamma * lambda))

        if (done) break

        state = nextState
      }

      VTrack[episode] = [...V]
    })
    return { V, VTrack }
  }
}

const rw = new RandomWalk_MDP(5)
const allLeftPolicy = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
}
const env = new Environment(rw)
const policy = new Policy(rw.states, allLeftPolicy)
const correctV = policyEvaluation(policy, rw)
const evaluator = new StateValueEvaluator()

// const Vs = zeros(7)
// _.times(10, () => {
//   // const { V: estimateV, VTrack } = evaluator.tdPrediction(policy, env)
//   const { V: estimateV, VTrack } = evaluator.tdPrediction(policy, env)
//   _.each(estimateV, (v, index) => {
//     Vs[index] += v
//   })
// })
// _.each(Vs, (v, index) => {
//   Vs[index] /= 10
// })
// console.log(Vs)

const strategies = [
  {
    name: 'mc',
    exec: 'mcPrediction',
  },
  {
    name: 'td',
    exec: 'tdPrediction',
  },
  {
    name: 'ntd',
    exec: 'ntdPrediction',
  },
  {
    name: 'td-lambda',
    exec: 'tdLambdaPrediction',
  },
]

_.each(strategies, (strategy) => {
  const { V, VTrack } = (evaluator as any)[strategy.exec](policy, env)
  const dir = path.join(__dirname, '../../assets/RL-results', 'random-walk')

  fs.ensureDirSync(dir)
  fs.writeFileSync(
    path.join(dir, `state-value-evaluation-with-${strategy.name}.json`),
    JSON.stringify({ V, VTrack })
  )
})
