import LandingInteractions from './LandingInteractions'
import { LANDING_HTML } from './landing-html'

export default function Home() {
  return (
    <div className="landing-root">
      <div className="paper" aria-hidden="true" />
      <div className="page" dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
      <LandingInteractions />
    </div>
  )
}
