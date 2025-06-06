import { createFileRoute } from '@tanstack/solid-router'
export const Route = createFileRoute('/_protected/_app/video')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/_app/video"!</div>
}
