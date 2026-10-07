import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import { Members, MemberDetail } from './pages/Members'
import { Practices, PracticeDetail } from './pages/Practices'
import { Programs, ProgramDetail } from './pages/Programs'
import Tasks from './pages/Tasks'
import { Events, EventDetail } from './pages/Events'
import { Fundraising, FundraiserDetail } from './pages/Fundraising'
import { Sponsors, SponsorDetail } from './pages/Sponsors'
import { Grants, GrantDetail } from './pages/Grants'
import GrantBuilder from './pages/GrantBuilder'
import Volunteers from './pages/Volunteers'
import Contacts from './pages/Contacts'
import Finance from './pages/Finance'
import Documents from './pages/Documents'
import { Meetings, MeetingDetail } from './pages/Meetings'
import Agm from './pages/Agm'
import Compliance from './pages/Compliance'
import Equipment from './pages/Equipment'
import Safety from './pages/Safety'
import SocialHub from './pages/SocialHub'
import Composer from './pages/Composer'
import PostDetail from './pages/PostDetail'
import SocialCalendar from './pages/SocialCalendar'
import SocialAnalytics from './pages/SocialAnalytics'
import { Campaigns, CampaignDetail } from './pages/SocialCampaigns'
import SocialExposure from './pages/SocialExposure'
import SocialAccounts from './pages/SocialAccounts'
import Media from './pages/Media'
import Reports, { AnnualReport } from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} /><Route path="/members/:id" element={<MemberDetail />} />
        <Route path="/practices" element={<Practices />} /><Route path="/practices/:id" element={<PracticeDetail />} />
        <Route path="/programs" element={<Programs />} /><Route path="/programs/:id" element={<ProgramDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/events" element={<Events />} /><Route path="/events/:id" element={<EventDetail />} />
        <Route path="/fundraising" element={<Fundraising />} /><Route path="/fundraising/:id" element={<FundraiserDetail />} />
        <Route path="/sponsors" element={<Sponsors />} /><Route path="/sponsors/:id" element={<SponsorDetail />} />
        <Route path="/grants" element={<Grants />} /><Route path="/grants/:id" element={<GrantDetail />} />
        <Route path="/grant-builder" element={<GrantBuilder />} />
        <Route path="/volunteers" element={<Volunteers />} /><Route path="/contacts" element={<Contacts />} />
        <Route path="/finance" element={<Finance />} /><Route path="/finance/:tab" element={<Finance />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/meetings" element={<Meetings />} /><Route path="/meetings/:id" element={<MeetingDetail />} />
        <Route path="/agm" element={<Agm />} /><Route path="/compliance" element={<Compliance />} />
        <Route path="/equipment" element={<Equipment />} /><Route path="/safety" element={<Safety />} />
        <Route path="/social" element={<SocialHub />} /><Route path="/social/composer" element={<Composer />} />
        <Route path="/social/posts/:id" element={<PostDetail />} /><Route path="/social/calendar" element={<SocialCalendar />} />
        <Route path="/social/analytics" element={<SocialAnalytics />} />
        <Route path="/social/campaigns" element={<Campaigns />} /><Route path="/social/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/social/exposure" element={<SocialExposure />} /><Route path="/social/accounts" element={<SocialAccounts />} />
        <Route path="/media" element={<Media />} />
        <Route path="/reports" element={<Reports />} /><Route path="/annual-report" element={<AnnualReport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<div className="card">Page not found.</div>} />
      </Routes>
    </Layout>
  )
}
