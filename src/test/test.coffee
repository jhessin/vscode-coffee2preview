import m from 'mithril'

data = [
  'row one',
  'row two'
]
export class MyView
  view:->
    m 'div',
      m 'table',
        for value in data
          m 'p', value
          m 'p', 'another string'
