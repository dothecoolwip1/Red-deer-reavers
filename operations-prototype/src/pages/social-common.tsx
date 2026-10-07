import { NavLink } from 'react-router-dom'
import { adapters } from '../services/social'
import type { PlatformId } from '../types'

export const PlatformTag = ({ p }: { p: PlatformId }) => <span><span className="plat-dot" style={{ background: adapters[p].capabilities.color }}>{adapters[p].capabilities.icon}</span>{adapters[p].capabilities.label}</span>
const links: [string, string][] = [['Hub', '/social'], ['Composer', '/social/composer'], ['Calendar', '/social/calendar'], ['Analytics', '/social/analytics'], ['Campaigns', '/social/campaigns'], ['Sponsor exposure', '/social/exposure'], ['Accounts', '/social/accounts'], ['Media library', '/media']]
export const SocialNav = () => <div className="pills no-print" style={{ marginBottom: '.8rem' }}>{links.map(([l, to]) => <NavLink key={to} to={to} end className={({ isActive }) => 'pill' + (isActive ? ' on' : '')}>{l}</NavLink>)}</div>
