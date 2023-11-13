import { Environment } from '../environment'
import { Experience } from '../types'

export const generateTrajectory = (
  selectAction: any,
  Q: any,
  epsilon: number,
  env: Environment,
  maxSteps: number = 200
) => {
  let counter = 0
  let trajectory: Experience[] = []

  env.reset()
  let state = env.currentState

  while (true) {
    if (counter > maxSteps) break

    const actionIndex = selectAction(state, Q, epsilon)
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
    if (counter > maxSteps) {
      // if the trajectory does not meet the fianl state, then the trajectory
      // is abandoned
      trajectory = []
      break
    }

    state = nextState
    counter += 1
  }

  return trajectory
}
