import { NavigatorScreenParams } from '@react-navigation/native';

// Root stack param list
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Report: { location?: { latitude: number; longitude: number } };
  SafeRoute: { origin?: { latitude: number; longitude: number }; destination?: { latitude: number; longitude: number } };
  SOS: undefined;
  Rating: { routeId: string; startLocation: { latitude: number; longitude: number }; endLocation: { latitude: number; longitude: number } };
  WalkWithMe: undefined;
  WatchWalk: { sessionId: string };
  ReportDetail: { reportId: string };
  Auth: undefined;
};

// Main tab param list
export type MainTabParamList = {
  Map: undefined;
  SafeRoute: undefined;
  WalkWithMe: undefined;
  Contacts: undefined;
  Profile: undefined;
};

// Declare global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
