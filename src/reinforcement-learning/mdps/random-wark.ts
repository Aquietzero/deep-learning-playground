import { MDP } from '../mdp'
import * as _ from 'lodash'
import { State, Transition, Action } from '../types'
import { full, randomNormal } from '../utils'

// random walk
export class RandomWalk_MDP extends MDP {
  n: number = 5
  probabilities: number[] = []
  rewards: number[] = []

  constructor(n: number = 10) {
    super()

    const move = (name: string, index: number) => {
      const action = new Action(name)
      action.transitions = [
        new Transition(
          0.5,
          index - 1,
          this.isGoal(index - 1) ? 1 : 0,
          this.isDone(index - 1)
        ),
        new Transition(
          0.5,
          index + 1,
          this.isGoal(index + 1) ? 1 : 0,
          this.isDone(index + 1)
        ),
      ]
      return action
    }

    this.startState = 1
    this.endState = n + 1

    const state0 = new State(0)
    state0.isDone = true
    state0.isGoal = false

    const stateGoal = new State(n + 1)
    stateGoal.isDone = true
    stateGoal.isGoal = true

    this.states = {
      0: state0,
      [n + 1]: stateGoal,
    }

    _.times(n, (index) => {
      const id = index + 1
      const state = new State(id)
      state.isDone = false
      state.isGoal = false
      state.actions = [move('left', id), move('right', id)]
      this.states[id] = state
    })

    this.actionSpace = [move('left', 0), move('right', 0)]
  }

  isGoal(id: number): boolean {
    return id === this.n + 1
  }

  isDone(id: number): boolean {
    return id === 0 || this.isGoal(id)
  }
}
