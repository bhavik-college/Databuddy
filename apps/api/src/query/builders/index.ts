export * from './device'
export * from './geography'
export * from './pages'
export * from './utm'
export * from './performance'
export * from './errors'
export * from './web-vitals'
export * from './custom-events'
export * from './summary'
export * from './user-journey'
export * from './funnel'
export * from './aliases'
export * from './revenue'
export * from './real-time'

import type { ParameterBuilder } from '../types'
import { deviceBuilders } from './device'
import { geographyBuilders } from './geography'
import { pageBuilders } from './pages'
import { utmBuilders } from './utm'
import { performanceBuilders } from './performance'
import { errorBuilders } from './errors'
import { webVitalsBuilders } from './web-vitals'
import { customEventBuilders } from './custom-events'
import { summaryBuilders } from './summary'
import { userJourneyBuilders } from './user-journey'
import { funnelBuilders } from './funnel'
import { aliasBuilders } from './aliases'
import { revenueBuilders } from './revenue'
import { realTimeBuilders } from './real-time'

export const PARAMETER_BUILDERS: Record<string, ParameterBuilder> = {
  ...deviceBuilders,
  ...geographyBuilders,
  ...pageBuilders,
  ...utmBuilders,
  ...performanceBuilders,
  ...errorBuilders,
  ...webVitalsBuilders,
  ...customEventBuilders,
  ...summaryBuilders,
  ...userJourneyBuilders,
  ...funnelBuilders,
  ...aliasBuilders,
  ...revenueBuilders,
  ...realTimeBuilders,
} 