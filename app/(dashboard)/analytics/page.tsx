import { getAnalyticsPayload, getUpcomingEvents } from "./actions";
import { AnalyticsPage } from "@/components/analytics/analytics-page";

export default async function AnalyticsPageRoute() {
  const [payload, upcomingEvents] = await Promise.all([
    getAnalyticsPayload(),
    getUpcomingEvents(10),
  ]);

  return <AnalyticsPage payload={payload} initialUpcoming={upcomingEvents} />;
}
