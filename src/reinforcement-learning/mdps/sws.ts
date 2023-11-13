// slippery walk seven mdp
import { MDP } from '../mdp'
import * as _ from 'lodash'
import { ID, State, Transition, Action } from '../types'

export class SWS_MDP extends MDP {
  constructor() {
    super()

    const leftOf = (index: number) => index - 1
    const rightOf = (index: number) => index + 1

    const move = (name: string, index: number) => {
      const action = new Action(name)
      const left = leftOf(index)
      const right = rightOf(index)
      const intended = name === 'left' ? left : right
      const opposite = name === 'left' ? right : left

      action.transitions = [
        new Transition(
          1 / 2,
          intended,
          this.isGoal(intended) ? 1 : 0,
          this.isDone(intended)
        ),
        new Transition(
          1 / 3,
          index,
          this.isGoal(index) ? 1 : 0,
          this.isDone(index)
        ),
        new Transition(
          1 / 6,
          opposite,
          this.isGoal(opposite) ? 1 : 0,
          this.isDone(opposite)
        ),
      ]
      return action
    }

    this.startState = 1
    this.endState = 8

    const state0 = new State(0)
    state0.isDone = true
    state0.isGoal = false

    const stateGoal = new State(8)
    stateGoal.isDone = true
    stateGoal.isGoal = true

    this.states = {
      0: state0,
      8: stateGoal,
    }

    _.times(7, (index) => {
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
    return id === 8
  }

  isDone(id: number): boolean {
    return id === 0 || this.isGoal(id)
  }
}
