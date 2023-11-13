// frozen lake mdp
import { MDP } from '../mdp'
import * as _ from 'lodash'
import { ID, State, Transition, Action } from '../types'

export class FL_MDP extends MDP {
  N: number
  holes: number[] = []

  constructor(N: number = 4, holes?: number[]) {
    super()
    this.N = N

    this.startState = 0
    this.endState = N * N - 1
    // 30% of holes
    this.holes =
      holes || _.sampleSize(_.range(3, this.endState), Math.ceil(N * N * 0.2))

    // 4x4 grid
    const up = (row: number, col: number) => [row - 1 < 0 ? row : row - 1, col]
    const left = (row: number, col: number) => [
      row,
      col - 1 < 0 ? col : col - 1,
    ]
    const right = (row: number, col: number) => [
      row,
      col + 1 >= N ? col : col + 1,
    ]
    const down = (row: number, col: number) => [
      row + 1 >= N ? row : row + 1,
      col,
    ]
    const stateId = (row: number, col: number) => row * N + col
    const possibleTransitions: { [dir: string]: string[] } = {
      up: ['up', 'left', 'right'],
      left: ['left', 'up', 'down'],
      right: ['right', 'up', 'down'],
      down: ['down', 'left', 'right'],
    }
    const move = (
      row: number,
      col: number,
      actionName: any,
      actionFunctions: any
    ): Action => {
      const transitions = _.map(
        possibleTransitions[actionName],
        (dir, index) => {
          const [nextRow, nextCol] = actionFunctions[dir](row, col)
          const nextStateId = stateId(nextRow, nextCol)
          const reward = this.isGoal(nextStateId) ? 1 : 0
          const probability = 1 / 3

          return new Transition(
            probability,
            nextStateId,
            reward,
            this.isGoal(nextStateId) || this.isHole(nextStateId)
          )
        }
      )

      const action = new Action(actionName)
      action.transitions = transitions
      return action
    }

    for (let row = 0; row < N; row++) {
      for (let col = 0; col < N; col++) {
        const id = stateId(row, col)
        const state = new State(id)
        state.isDone = this.isDone(id)
        state.isGoal = this.isGoal(id)
        const actionFunctions = { up, left, right, down }
        const actions = _.map(['up', 'right', 'down', 'left'], (actionName) => {
          return move(row, col, actionName, actionFunctions)
        })
        state.actions = actions

        this.states[id] = state
      }
    }

    this.actionSpace = [
      new Action('up'),
      new Action('right'),
      new Action('down'),
      new Action('left'),
    ]
  }

  isGoal(id: number): boolean {
    return id === this.endState
  }

  isHole(id: number): boolean {
    return _.includes(this.holes, id)
  }

  isDone(id: number): boolean {
    return this.isGoal(id) || this.isHole(id)
  }
}
