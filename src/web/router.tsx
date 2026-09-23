import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Shell } from './components/Shell';
import { TodayScreen } from './features/today/TodayScreen';
import { WeekScreen } from './features/week/WeekScreen';
import { GroupsScreen } from './features/groups/GroupsScreen';
import { GroupDetailScreen } from './features/groups/GroupDetailScreen';
import { LearnerProfileScreen } from './features/learners/LearnerProfileScreen';
import { PlansScreen } from './features/plans/PlansScreen';
import { PlanDetailScreen } from './features/plans/PlanDetailScreen';
import { PlanPrintView } from './features/plans/PlanPrintView';
import { NotesScreen } from './features/notes/NotesScreen';
import { SessionDetailScreen } from './features/sessions/SessionDetailScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { MoreScreen } from './features/more/MoreScreen';

const router = createBrowserRouter([
  {
    path: "/plans/:id/print",
    element: <PlanPrintView />
  },
  {
    path: "/",
    element: <Shell />,
    children: [
      {
        index: true,
        element: <TodayScreen />
      },
      {
        path: "week",
        element: <WeekScreen />
      },
      {
        path: "groups",
        element: <GroupsScreen />
      },
      {
        path: "groups/:id",
        element: <GroupDetailScreen />
      },
      {
        path: "learners/:id",
        element: <LearnerProfileScreen />
      },
      {
        path: "plans",
        element: <PlansScreen />
      },
      {
        path: "plans/new",
        element: <PlanDetailScreen />
      },
      {
        path: "plans/:id",
        element: <PlanDetailScreen />
      },
      {
        path: "notes",
        element: <NotesScreen />
      },
      {
        path: "sessions/:id",
        element: <SessionDetailScreen />
      },
      {
        path: "more",
        element: <MoreScreen />
      },
      {
        path: "settings",
        element: <SettingsScreen />
      },
      {
        path: "*",
        element: <div className="p-4">Not Found</div>
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
