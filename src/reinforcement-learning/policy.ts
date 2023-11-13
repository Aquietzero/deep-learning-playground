import * as _ from 'lodash'
import { MDP } from './mdp'
import { ID, State, Action } from './types'
import { argmax } from './utils'

export class Policy {
  states: { [id: ID]: State } = {}
  actionMap: { [stateId: ID]: number } = {}

  constructor(states: { [id: ID]: State }, policy?: any) {
    this.states = states
    if (policy) {
      this.actionMap = policy
    } else {
      _.each(this.states, (state) => {
        if (!state.actions || state.actions.length === 0) {
          this.actionMap[state.id] = -1
        } else {
          this.actionMap[state.id] = _.random(
            0,
            state.actions.length - 1,
            false
          )
        }
      })
    }
  }

  clone() {
    return new Policy(this.states, _.cloneDeep(this.actionMap))
  }

  equalTo(p: Policy): boolean {
    let isEqual = true
    _.each(this.actionMap, (actionIndex, stateId) => {
      if (p.actionMap[stateId] !== actionIndex) {
        isEqual = false
      }
    })

    return isEqual
  }

  takeAction(state: State): { action: Action; actionIndex: ID } {
    if (state.isDone) return { action: null, actionIndex: -1 }

    const actionIndex = this.actionMap[state.id]
    return {
      actionIndex,
      action: state.actions[actionIndex],
    }
  }

  run(mdp: MDP) {
    let currentState = mdp.startState
    let reachGoal = false

    while (true) {
      const state = mdp.states[currentState]
      if (state.isDone) {
        if (state.isGoal) reachGoal = true
        break
      }

      const { action } = this.takeAction(state)
      let targetTransition = action.exec()
      currentState = targetTransition.nextState
    }

    return reachGoal
  }

  successRate(P: MDP): number {
    let counter = 0
    const total = 1000
    _.times(total, () => {
      const reachGoal = this.run(P)
      if (reachGoal) counter += 1
    })

    return counter / total
  }
}

const initV = (P: MDP) => {
  const V: { [id: string]: number } = {}
  _.each(P.states, (state) => (V[state.id] = 0))
  return V
}

const diffV = (v1: any, v2: any): number => {
  return _.max(
    _.map(v1, (val, stateId) => {
      return Math.abs(v2[stateId] - val)
    })
  )
}

export const policyEvaluation = (
  pi: Policy,
  P: MDP,
  gamma = 1.0,
  theta = 1e-10
) => {
  let prevV = initV(P)
  let V = initV(P)

  let count = 0
  while (true) {
    V = initV(P)
    count += 1
    _.each(P.states, (state, id) => {
      const { action } = pi.takeAction(state)
      if (!action) return
      _.each(action.transitions, (transition) => {
        const { probability, nextState, reward, done } = transition
        const doneFlag = !done ? 1 : 0
        V[state.id] +=
          probability * (reward + gamma * prevV[nextState] * doneFlag)
      })
    })

    if (diffV(V, prevV) < theta) break

    prevV = _.cloneDeep(V)
  }

  console.log('iters: ', count)
  return V
}

export const policyImprovement = (V: any, P: MDP, gamma = 1.0): Policy => {
  const Q: any = {}

  _.each(P.states, (state) => {
    _.each(state.actions, (action, actionIndex) => {
      _.each(action.transitions, (transition) => {
        const { probability, nextState, reward, done } = transition
        const doneFlag = !done ? 1 : 0

        if (!Q[state.id]) Q[state.id] = new Array(state.actions.length).fill(0)

        Q[state.id][actionIndex] +=
          probability * (reward + gamma * V[nextState] * doneFlag)
      })
    })
  })

  const policy = new Policy(P.states)
  policy.actionMap = {}
  _.each(Q, (actions, stateId) => {
    let max = -Infinity
    let actionIndex = 0
    for (let i = 0; i < actions.length; ++i) {
      if (actions[i] > max) {
        max = actions[i]
        actionIndex = i
      }
    }

    policy.actionMap[stateId] = actionIndex
  })

  return policy
}

export function* policyIterationGenerator(P: MDP, gamma = 1.0, theta = 1e-10) {
  let V
  let policy = new Policy(P.states)

  while (true) {
    const oldPolicy = policy.clone()
    V = policyEvaluation(policy, P, gamma, theta)
    policy = policyImprovement(V, P, gamma)

    yield { V, policy }

    if (oldPolicy.equalTo(policy)) break
  }

  return { V, policy }
}

export const policyIteration = (P: MDP, gamma = 1.0, theta = 1e-10) => {
  const gen = policyIterationGenerator(P, gamma, theta)
  let result = gen.next()
  let counter = 0
  while (!result.done) {
    counter += 1
    result = gen.next()
  }
  console.log('policy iteration: ', counter)
  return result.value as any
}

export function* valueIterationGenerator(P: MDP, gamma = 1.0, theta = 1e-10) {
  let V = initV(P)
  let Q: any = {}
  let policy = new Policy(P.states)

  while (true) {
    const Q: any = {}

    _.each(P.states, (state) => {
      _.each(state.actions, (action, actionIndex) => {
        _.each(action.transitions, (transition) => {
          const { probability, nextState, reward, done } = transition
          const doneFlag = !done ? 1 : 0

          if (!Q[state.id])
            Q[state.id] = new Array(state.actions.length).fill(0)

          Q[state.id][actionIndex] +=
            probability * (reward + gamma * V[nextState] * doneFlag)
        })
      })
    })

    const newV = initV(P)
    _.each(P.states, (state) => {
      newV[state.id] = _.max(Q[state.id])
    })
    if (diffV(V, newV) < theta) break

    V = { ...newV }

    yield { V }
  }

  _.each(Q, (actions, stateId) => {
    policy.actionMap[stateId] = argmax(actions)
  })

  return { V, policy }
}

export const valueIteration = (P: MDP, gamma = 1.0, theta = 1e-10) => {
  const gen = valueIterationGenerator(P, gamma, theta)
  let result = gen.next()
  let counter = 0
  while (!result.done) {
    counter += 1
    result = gen.next()
  }
  console.log('value iteration: ', counter)
  return result.value as any
}

export const goGetItPolicy = {
  0: 1,
  1: 1,
  2: 2,
  3: 3,
  4: 2,
  5: 0,
  6: 2,
  7: 0,
  8: 1,
  9: 1,
  10: 2,
  11: 0,
  12: 0,
  13: 1,
  14: 1,
  15: 0,
}

export const carefulPolicy = {
  0: 3,
  1: 0,
  2: 0,
  3: 0,
  4: 3,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 2,
  10: 3,
  11: 0,
  12: 0,
  13: 1,
  14: 1,
  15: 0,
}
