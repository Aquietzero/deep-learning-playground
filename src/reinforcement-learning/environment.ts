import { ID, Action, Transition } from './types'
import { MDP } from './mdp'

export class Environment {
  mdp: MDP
  currentState: ID
  actionSpace: Action[]

  constructor(mdp: MDP) {
    this.mdp = mdp
    this.currentState = this.mdp.startState
    this.actionSpace = this.mdp.actionSpace
  }

  reset() {
    this.currentState = this.mdp.startState
  }

  step(actionId: ID): Transition {
    const action: Action =
      this.mdp.states[this.currentState].actions[actionId as number]
    const transition: Transition = action.exec()
    this.currentState = transition.nextState
    return transition
  }
}
