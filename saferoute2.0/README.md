# SafeRoute 🛡️

A React Native/Expo mobile app for nighttime safety navigation. SafeRoute helps users navigate safely at night by providing real-time hazard information, community-driven safety reports, and emergency SOS features.

## Features

### 🗺️ Smart Map
- Full-screen dark-themed map optimized for night use
- Real-time display of community-reported hazards
- Color-coded markers for different hazard types
- Crowd density heatmaps

### 🆘 SOS Emergency Button
- One-tap emergency alert activation
- Automatic location sharing with trusted contacts
- Continuous location tracking during emergencies
- Vibration alerts for attention

### 📝 Community Reports
- Report various hazard types:
  - Dark spots (poor lighting)
  - Stray dogs
  - Harassment incidents
  - Light failures
  - Suspicious activities
- Attach photos to reports
- Location selection via map or current GPS
- Offline support with sync when online

### 🚶 Walk With Me
- Live location tracking during walks
- Share your walk in real-time with trusted contacts
- Set destination with ETA tracking
- Safety monitoring throughout your journey

### 👥 Trusted Contacts
- Manage your emergency contacts
- Send invitation links for app connection
- Control who can track your location
- Instant notifications during SOS

### ⭐ Street Ratings
- Rate streets based on:
  - Lighting quality
  - Crowd presence
  - Safety feeling
- Contribute to community safety data
- Help others find safer routes

### 🛤️ Safe Route Planning
- Find the safest path to your destination
- Routes weighted by:
  - Community ratings
  - Hazard reports
  - Lighting conditions
  - Crowd density
- Alternative route options with safety scores

## Tech Stack

- **Framework**: React Native with Expo SDK 51
- **Language**: TypeScript
- **Navigation**: React Navigation 6 (Stack + Tabs)
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Storage)
- **Maps**: Google Maps (react-native-maps)
- **State Management**: React Hooks + Context

## Project Structure

```
saferoute2.0/
├── App.tsx                 # App entry point
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── src/
    ├── components/        # Reusable UI components
    │   ├── MapHeader.tsx
    │   ├── SOSButton.tsx
    │   ├── ReportButton.tsx
    │   ├── SafeRouteButton.tsx
    │   ├── MapMarkers.tsx
    │   ├── BottomSheet.tsx
    │   ├── ReportCard.tsx
    │   ├── InputField.tsx
    │   ├── Button.tsx
    │   ├── RatingStars.tsx
    │   └── SafetyScoreBadge.tsx
    ├── config/            # App configuration
    │   ├── firebase.ts
    │   ├── theme.ts
    │   └── constants.ts
    ├── hooks/             # Custom React hooks
    │   ├── useAuth.ts
    │   ├── useLocation.ts
    │   ├── useReports.ts
    │   ├── useSOS.ts
    │   ├── useWalkWithMe.ts
    │   └── useCrowdDensity.ts
    ├── navigation/        # Navigation configuration
    │   └── AppNavigator.tsx
    ├── screens/           # Screen components
    │   ├── MapScreen.tsx
    │   ├── ReportScreen.tsx
    │   ├── SOSScreen.tsx
    │   ├── TrustedContactsScreen.tsx
    │   ├── WalkWithMeScreen.tsx
    │   ├── RatingScreen.tsx
    │   └── SafeRouteScreen.tsx
    ├── services/          # Firebase services
    │   ├── firebase.ts
    │   ├── authService.ts
    │   ├── reportService.ts
    │   ├── sosService.ts
    │   ├── contactService.ts
    │   ├── walkWithMeService.ts
    │   ├── routeService.ts
    │   ├── crowdService.ts
    │   ├── ratingService.ts
    │   └── storageService.ts
    ├── types/             # TypeScript definitions
    │   ├── user.ts
    │   ├── location.ts
    │   ├── report.ts
    │   ├── rating.ts
    │   ├── route.ts
    │   ├── sos.ts
    │   ├── contact.ts
    │   ├── walkWithMe.ts
    │   ├── crowd.ts
    │   └── navigation.ts
    └── utils/             # Utility functions
        ├── location.ts
        └── validation.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/saferoute.git
cd saferoute2.0
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, Realtime Database, and Storage
   - Copy your config to `src/config/firebase.ts`

4. Configure Google Maps:
   - Get API keys from [Google Cloud Console](https://console.cloud.google.com)
   - Add keys to `app.json` for iOS and Android

5. Start the development server:
```bash
npm start
```

6. Run on device/emulator:
```bash
npm run android  # For Android
npm run ios      # For iOS (Mac only)
```

## Firebase Setup

### Firestore Collections

- `users` - User profiles and settings
- `reports` - Community hazard reports
- `trustedContacts` - User's emergency contacts
- `ratings` - Street safety ratings

### Realtime Database Structure

```
/sosAlerts/{alertId}
/walkSessions/{sessionId}
/crowdDensity/{areaId}
```

### Security Rules

Apply appropriate Firebase security rules to protect user data.

## Environment Variables

Create a `.env` file with:

```env
GOOGLE_MAPS_API_KEY_IOS=your_ios_key
GOOGLE_MAPS_API_KEY_ANDROID=your_android_key
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_DATABASE_URL=your_database_url
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Safety Disclaimer

SafeRoute is designed to help users make informed decisions about their safety. It should not be used as the sole source of safety information. Always trust your instincts and contact local emergency services (911) in case of real emergencies.

## Support

For support, email support@saferoute.app or open an issue in this repository.
