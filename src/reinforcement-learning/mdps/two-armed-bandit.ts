import { MDP } from '../mdp'
import * as _ from 'lodash'
import { State, Transition, Action } from '../types'

// two-armed bernoulli bandit
// (reward: 1)                               (reward: 1)
//      0 <------ alpha ------- 1 ------- beta ------> 2
//        <---- 1 - beta ------' `---- 1 - alpha ----> 2
export class TwoArmedBandit_MDP extends MDP {
  alpha: number
  beta: number

  constructor() {
    super()
    this.alpha = Math.random()
    this.beta = Math.random()

    console.log(`alpha: `, this.alpha)
    console.log(`beta: `, this.beta)

    this.startState = 1
    this.endState = 2

    const state0 = new State(0)
    state0.isDone = true
    state0.isGoal = true

    const state2 = new State(2)
    state2.isDone = true
    state2.isGoal = true

    const moveLeft = new Action('left')
    moveLeft.transitions = [
      new Transition(this.alpha, 0, 1, true),
      new Transition(1 - this.alpha, 0, 0, true),
    ]
    const moveRight = new Action('right')
    moveRight.transitions = [
      new Transition(this.beta, 2, 1, true),
      new Transition(1 - this.beta, 2, 0, true),
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
    return id !== 1
  }
}
