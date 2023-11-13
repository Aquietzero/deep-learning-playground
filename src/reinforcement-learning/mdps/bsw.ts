// bandit slippery world mdp
import { MDP } from '../mdp'
import * as _ from 'lodash'
import { ID, State, Transition, Action } from '../types'

export class BSW_MDP extends MDP {
  constructor() {
    super()
    this.startState = 1
    this.endState = 2

    const state0 = new State(0)
    state0.isDone = true
    state0.isGoal = false

    const state2 = new State(2)
    state2.isDone = true
    state2.isGoal = false

    const moveLeft = new Action('left')
    moveLeft.transitions = [
      new Transition(0.8, 0, 0, true),
      new Transition(0.2, 1, 1, true),
    ]
    const moveRight = new Action('right')
    moveRight.transitions = [
      new Transition(0.2, 0, 0, true),
      new Transition(0.8, 1, 1, true),
    ]

    const state1 = new State(1)
    state1.isDone = true
    state1.isGoal = false
    state1.actions = [moveLeft, moveRight]

    this.states = {
      0: state0,
      1: state1,
      2: state2,
    }

    this.actionSpace = [new Action('left'), new Action('right')]
  }

  isGoal(id: number): boolean {
    return id === 2
  }

  isHole(id: number): boolean {
    return id === 0
  }
}
