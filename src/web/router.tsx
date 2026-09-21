import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Shell } from './components/Shell';
import { TodayScreen, WeekScreen, GroupsScreen, PlansScreen } from './features/home/PlaceholderScreens';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { MoreScreen } from './features/more/MoreScreen';

const router = createBrowserRouter([
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
        path: "plans",
        element: <PlansScreen />
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
