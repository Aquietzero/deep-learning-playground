import * as React from 'react'
import * as _ from 'lodash'
import classnames from 'classnames'
import { Link, useParams } from 'react-router-dom'
import examples from '@DLPlayground/playground/examples'

interface Props {
}

export const Nav: React.FC<Props> = (props: Props) => {
  const { example: currExample } = useParams()
  const [ shouldShow, setShouldShow ] = React.useState({
    'reinforcement-learning': true
  } as any)

  const formatName = (name: string) => {
    const snakeCase = _.snakeCase(name.replace('Example', '')).replace(/_/g, ' ')
    return snakeCase.replace('2 d', '2D').replace('3 d', '3D')
  }

  return (
    <div
      className="fixed h-full left-0 top-0 cursor-pointer pl-5 flex flex-col justify-center items-start"
    >
      {_.map(examples, (group, title)  => {
        return (
          <div key={title}>
            <div
              className="font-bold"
              onClick={e => setShouldShow({ ...shouldShow, [title]: !shouldShow[title] })}
            >
              { title }
            </div>
            {shouldShow[title] && <div className="pl-5">
              {_.map(group, (example, name) => {
                return (
                  <div key={name}>
                    <Link
                      className={classnames(currExample === name && 'text-blue-500')}
                      to={`/examples/${title}/${name}`}
                    >
                      { formatName(name) }
                    </Link>
                  </div>
                )
              })}
            </div>}
          </div>
        )
      })}
    </div>
  )
}
