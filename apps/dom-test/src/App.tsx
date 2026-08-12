import { HomePage } from '@app/pages/home/HomePage'
import { NotFoundPage } from '@app/pages/not-found/NotFoundPage'
import { PAGE_ROUTES } from '@app/routes'
import { Route, Router } from '@solidjs/router'
import { For } from 'solid-js'

export function App() {
  return (
    <Router>
      <Route path="/" component={HomePage} />
      <For each={PAGE_ROUTES}>
        {item => <Route path={item.path} component={item.component} />}
      </For>
      <Route path="*" component={NotFoundPage} />
    </Router>
  )
}
