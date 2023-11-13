import { MDP } from '../mdp'
import * as _ from 'lodash'
import { State, Transition, Action } from '../types'
import { full, randomNormal } from '../utils'

// n-armed gaussian bandit
export class NArmedBandit_MDP extends MDP {
  n: number = 10
  probabilities: number[] = []
  rewards: number[] = []

  constructor(n: number = 10) {
    super()

    this.rewards = _.times(n, () => randomNormal())
    this.probabilities = full(n, 1)

    console.log(`probabilities: `, this.probabilities)
    console.log(`rewards: `, this.rewards)

    const actions = _.times(n, (i) => {
      const action = new Action(`action-${i}`)
      action.transitions = [
        new Transition(this.probabilities[i], 1, this.rewards[i], true),
      ]
      return action
    })

    this.startState = 0
    this.endState = 1

    const state0 = new State(0)
    state0.isDone = false
    state0.isGoal = false
    state0.actions = actions

    const state1 = new State(1)
    state1.isDone = true
    state1.isGoal = true

    this.states = {
      0: state0,
      1: state1,
    }
    this.actionSpace = actions
  }

  isGoal(id: number): boolean {
    return id === 1
  }
}
