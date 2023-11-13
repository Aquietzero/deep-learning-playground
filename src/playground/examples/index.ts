import FrozenLake from './reinforcement-learning/frozen-lake/frozen-lake'
import FrozenLakePolicyIteration from './reinforcement-learning/frozen-lake/policy-iteration'
import FrozenLakeStateValueEvaluation from './reinforcement-learning/frozen-lake/state-value-evaluation'
import NArmedBernoulliBandit from './reinforcement-learning/bernoulli-bandit/n-armed-bandit'
import StateValueEvaluation from './reinforcement-learning/random-walk/state-value-evaluation'
import SlipperyWalkSeven from './reinforcement-learning/random-walk/slippery-walk-seven'

export default {
  'reinforcement-learning': {
    FrozenLake,
    FrozenLakePolicyIteration,
    FrozenLakeStateValueEvaluation,
    NArmedBernoulliBandit,
    StateValueEvaluation,
    SlipperyWalkSeven,
  },
}
