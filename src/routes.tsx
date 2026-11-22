import { lazy, type ComponentType, type ReactElement } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DeveloperRoute, RecruiterRoute } from "./components/RoleRoute";
import { RouteError } from "./components/RouteError";

const RELOADED_KEY = "devzgo.chunkReload";

/** Loads a page's code when it is first opened. After a deploy, old chunk names are gone, so reload once to fetch the new ones. */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() =>
    load().then(
      (module) => {
        sessionStorage.removeItem(RELOADED_KEY);
        return { default: module[name] };
      },
      (error: unknown) => {
        const last = Number(sessionStorage.getItem(RELOADED_KEY) || 0);
        const now = Date.now();
        // A missing chunk comes back as the HTML page. Retry once, then again after the new deploy is up.
        if (!last || now - last > 20000) {
          sessionStorage.setItem(RELOADED_KEY, String(now));
          const next = new URL(window.location.href);
          next.searchParams.set("v", String(now));
          window.location.replace(next.toString());
          return new Promise<never>(() => {});
        }
        throw error;
      }
    )
  );
}

const ProjectFormPage = page(() => import("./pages/ProjectFormPage"), "ProjectFormPage");
const LandingPage = page(() => import("./pages/LandingPage"), "LandingPage");
const ProfilePage = page(() => import("./pages/ProfilePage"), "ProfilePage");
const LoginPage = page(() => import("./pages/LoginPage"), "LoginPage");
const RegisterPage = page(() => import("./pages/RegisterPage"), "RegisterPage");
const VerifyEmailPage = page(() => import("./pages/VerifyEmailPage"), "VerifyEmailPage");
const ForgotPasswordPage = page(() => import("./pages/PasswordResetPages"), "ForgotPasswordPage");
const ResetPasswordPage = page(() => import("./pages/PasswordResetPages"), "ResetPasswordPage");
const AuthCallbackPage = page(() => import("./pages/AuthCallbackPage"), "AuthCallbackPage");
const GitHubOnboardingPage = page(() => import("./pages/GitHubOnboardingPage"), "GitHubOnboardingPage");
const SettingsPage = page(() => import("./pages/SettingsPage"), "SettingsPage");
const MyActivityPage = page(() => import("./pages/MyActivityPage"), "MyActivityPage");
const ProjectDetailPage = page(() => import("./pages/ProjectDetailPage"), "ProjectDetailPage");
const ProjectWorkspacePage = page(() => import("./pages/ProjectWorkspacePage"), "ProjectWorkspacePage");
const ExplorePage = page(() => import("./pages/ExplorePage"), "ExplorePage");
const CardsWorldPage = page(() => import("./pages/CardsWorldPage"), "CardsWorldPage");
const StudioWallPage = page(() => import("./pages/StudioWallPage"), "StudioWallPage");
const CatalogPage = page(() => import("./pages/CatalogPage"), "CatalogPage");
const DevelopersPage = page(() => import("./pages/DevelopersPage"), "DevelopersPage");
const WrapPage = page(() => import("./pages/WrapPage"), "WrapPage");
const NetworkPage = page(() => import("./pages/NetworkPage"), "NetworkPage");
const NetworkGroupsPage = page(() => import("./pages/NetworkGroupsPage"), "NetworkGroupsPage");
const GroupDetailPage = page(() => import("./pages/GroupDetailPage"), "GroupDetailPage");
const ConnectionsPage = page(() => import("./pages/ConnectionsPage"), "ConnectionsPage");
const PostPage = page(() => import("./pages/PostPage"), "PostPage");
const MessagesPage = page(() => import("./pages/MessagesPage"), "MessagesPage");
const GitHubImportPage = page(() => import("./pages/GitHubImportPage"), "GitHubImportPage");
const RecruiterDashboardPage = page(() => import("./pages/RecruiterDashboardPage"), "RecruiterDashboardPage");
const CandidatePage = page(() => import("./pages/CandidatePage"), "CandidatePage");
const ShortlistsPage = page(() => import("./pages/ShortlistsPage"), "ShortlistsPage");
const RecruiterInboxPage = page(() => import("./pages/RecruiterInboxPage"), "RecruiterInboxPage");
const OpportunitiesPage = page(() => import("./pages/OpportunitiesPage"), "OpportunitiesPage");
const MatchPage = page(() => import("./pages/MatchPage"), "MatchPage");
const RecruiterChallengesPage = page(() => import("./pages/RecruiterChallengesPage"), "RecruiterChallengesPage");
const RecruiterChallengePage = page(() => import("./pages/RecruiterChallengesPage"), "RecruiterChallengePage");
const ChallengeEditorPage = page(() => import("./pages/ChallengeEditorPage"), "ChallengeEditorPage");
const AssessmentsPage = page(() => import("./pages/AssessmentsPage"), "AssessmentsPage");
const AssessmentChallengePage = page(() => import("./pages/AssessmentsPage"), "AssessmentChallengePage");
const ResumeImportPage = page(() => import("./pages/ResumeImportPage"), "ResumeImportPage");
const ResumeStudioPage = page(() => import("./pages/ResumeStudioPage"), "ResumeStudioPage");
const PersonActivityPage = page(() => import("./pages/ActivityLogPage"), "PersonActivityPage");
const ProjectActivityPage = page(() => import("./pages/ActivityLogPage"), "ProjectActivityPage");
const AboutDevelopersPage = page(() => import("./pages/AboutDevelopersPage"), "AboutDevelopersPage");
const AdminLayout = page(() => import("./pages/admin/AdminLayout"), "AdminLayout");
const AdminOverviewPage = page(() => import("./pages/admin/OverviewPage"), "OverviewPage");
const AdminInsightsPage = page(() => import("./pages/admin/InsightsPage"), "InsightsPage");
const AdminPeoplePage = page(() => import("./pages/admin/PeoplePage"), "PeoplePage");
const AdminClubsPage = page(() => import("./pages/admin/ClubsAdminPage"), "AdminClubsPage");
const AdminPersonPage = page(() => import("./pages/admin/PersonPage"), "PersonPage");
const AdminAccessPage = page(() => import("./pages/admin/AccessPage"), "AccessPage");
const AdminApprovalsPage = page(() => import("./pages/admin/ApprovalsPage"), "ApprovalsPage");
const AdminAuditPage = page(() => import("./pages/admin/AuditPage"), "AuditPage");
const AdminTablePage = page(() => import("./pages/admin/TablePage"), "TablePage");
const AdminProjectIntelligencePage = page(() => import("./pages/admin/ProjectIntelligencePage"), "ProjectIntelligencePage");

const developer = (element: ReactElement) => <ProtectedRoute><DeveloperRoute>{element}</DeveloperRoute></ProtectedRoute>;
const recruiting = (element: ReactElement) => <ProtectedRoute><RecruiterRoute>{element}</RecruiterRoute></ProtectedRoute>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" replace />,
    errorElement: <RouteError />,
  },
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/home",
        element: developer(<LandingPage />),
      },
      {
        path: "/about-developers",
        element: <AboutDevelopersPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/auth/github/onboarding", element: <GitHubOnboardingPage /> },
      { path: "/settings", element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      { path: "/settings/activity", element: <ProtectedRoute><MyActivityPage /></ProtectedRoute> },
      {
        path: "/network",
        element: (
          <ProtectedRoute>
            <NetworkPage />
          </ProtectedRoute>
        ),
      },
      { path: "/network/groups", element: <ProtectedRoute><NetworkGroupsPage /></ProtectedRoute> },
      { path: "/network/groups/:groupId", element: <ProtectedRoute><GroupDetailPage /></ProtectedRoute> },
      { path: "/network/connections", element: <ProtectedRoute><ConnectionsPage /></ProtectedRoute> },
      { path: "/network/post/:id", element: <ProtectedRoute><PostPage /></ProtectedRoute> },
      {
        path: "/messages",
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore",
        element: (
          <ProtectedRoute>
            <StudioWallPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/tv",
        element: (
          <ProtectedRoute>
            <ExplorePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/cards",
        element: (
          <ProtectedRoute>
            <CardsWorldPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/studio",
        element: <Navigate to="/explore" replace />,
      },
      {
        path: "/explore/folio",
        element: <Navigate to="/explore/catalog" replace />,
      },
      {
        path: "/explore/lanterns",
        element: <Navigate to="/explore/catalog" replace />,
      },
      {
        path: "/explore/catalog",
        element: (
          <ProtectedRoute>
            <CatalogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore/developers",
        element: (
          <ProtectedRoute>
            <DevelopersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/add-project",
        element: developer(<ProjectFormPage />),
      },
      {
        path: "/import/github",
        element: developer(<GitHubImportPage />),
      },
      {
        path: "/project/:id/edit",
        element: developer(<ProjectFormPage />),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/:id",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/project/:id",
        element: (
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/project/:id/workspace",
        element: (
          <ProtectedRoute>
            <ProjectWorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/wrap",
        element: developer(<WrapPage />),
      },
      { path: "/opportunities", element: developer(<OpportunitiesPage />) },
      { path: "/profile/:id/activity", element: <ProtectedRoute><PersonActivityPage /></ProtectedRoute> },
      { path: "/project/:id/activity", element: <ProtectedRoute><ProjectActivityPage /></ProtectedRoute> },
      { path: "/recruit", element: recruiting(<RecruiterDashboardPage />) },
      { path: "/recruit/talent", element: recruiting(<DevelopersPage />) },
      { path: "/recruit/candidates/:id", element: recruiting(<CandidatePage />) },
      { path: "/recruit/shortlists", element: recruiting(<ShortlistsPage />) },
      { path: "/recruit/shortlists/:id", element: recruiting(<ShortlistsPage />) },
      { path: "/recruit/inbox", element: recruiting(<RecruiterInboxPage />) },
      { path: "/recruit/match", element: recruiting(<MatchPage />) },
      { path: "/recruit/challenges", element: recruiting(<RecruiterChallengesPage />) },
      { path: "/recruit/challenges/new", element: recruiting(<ChallengeEditorPage />) },
      { path: "/recruit/challenges/:id", element: recruiting(<RecruiterChallengePage />) },
      { path: "/recruit/challenges/:id/edit", element: recruiting(<ChallengeEditorPage />) },
      { path: "/assessments", element: developer(<AssessmentsPage />) },
      { path: "/assessments/:id", element: developer(<AssessmentChallengePage />) },
      { path: "/career/import", element: developer(<ResumeImportPage />) },
      { path: "/career/studio", element: developer(<ResumeStudioPage />) },
      {
        path: "/admin",
        element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <AdminOverviewPage /> },
          { path: "insights", element: <AdminInsightsPage /> },
          { path: "project-intelligence", element: <AdminProjectIntelligencePage /> },
          { path: "people", element: <AdminPeoplePage /> },
          { path: "people/:userId", element: <AdminPersonPage /> },
          { path: "clubs", element: <AdminClubsPage /> },
          { path: "access", element: <AdminAccessPage /> },
          { path: "approvals", element: <AdminApprovalsPage /> },
          { path: "audit", element: <AdminAuditPage /> },
          { path: "browse/:group/:table", element: <AdminTablePage /> },
        ],
      },

    ],
  },
  {
    path: "*",
    element: <Navigate to="/home" replace />,
  },
]);
