import * as _ from 'lodash'
import * as uuid from 'short-uuid'

export type ID = string | number

export class Transition {
  probability: number = 0
  nextState: ID
  reward: number = 0
  done: boolean = false

  constructor(
    probability: number,
    nextState: ID,
    reward: number,
    done: boolean
  ) {
    this.probability = probability
    this.nextState = nextState
    this.reward = reward
    this.done = done
  }
}

export class Action {
  name: string
  transitions: Transition[]

  constructor(name?: string) {
    this.name = name
  }

  // exec the action, choose a transition according to the
  // probability distribution
  exec(): Transition {
    const probability = Math.random()
    let cumulatedProbability = 0
    let targetTransition = _.last(this.transitions)
    for (let i = 0; i < this.transitions.length; ++i) {
      const transition = this.transitions[i]
      cumulatedProbability += transition.probability
      if (probability < cumulatedProbability) {
        targetTransition = transition
        break
      }
    }
    return targetTransition
  }
}

export class State {
  id: ID
  isDone: boolean
  isGoal: boolean
  actions: Action[]

  getId(): string {
    return uuid.generate()
  }

  constructor(id: ID) {
    this.id = _.isNumber(id) ? id : this.getId()
  }
}

export type Strategy = {
  name: string
  initialize?: Function
  run: Function
}

export type TrainContext = {
  nEpisodes: number
  episode: number
  Q: any
  N: any
}

export class Experience {
  state: ID
  action: ID
  reward: number
  nextState: ID
  done: boolean

  constructor(
    state: ID,
    action: ID,
    reward: number,
    nextState: ID,
    done: boolean
  ) {
    this.state = state
    this.action = action
    this.reward = reward
    this.nextState = nextState
    this.done = done
  }
}

export interface LearningOpts {
  gamma: number
  initAlpha: number
  minAlpha: number
  alphaDecayRatio: number
  initEpsilon: number
  minEpsilon: number
  epsilonDecayRatio: number
  nEpisodes: number
}
