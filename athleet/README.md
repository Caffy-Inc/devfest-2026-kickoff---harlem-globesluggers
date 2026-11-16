# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Deploy the website (GitHub Pages)

The web app is published to **https://bloxxyis.github.io/devfest-2026-kickoff---harlem-globesluggers/** by the
workflow in `.github/workflows/deploy-pages.yml`. It runs on every push to `main` that touches `athleet/`
(or manually from the **Actions** tab), checks types, lint and tests, builds, and deploys.

One-time setup: on GitHub go to **Settings → Pages** and set **Source** to **GitHub Actions**.

Try the exact production build locally first:

```bash
npm run preview:pages   # builds into dist/ and serves it at http://localhost:8080/devfest-2026-kickoff---harlem-globesluggers/
```

What's different on GitHub Pages (it only hosts static files):

- The build uses `static` output with the repo name as the base URL (see `app.config.js`). Local
  development with `npx expo start` is unchanged.
- The voice API routes (`src/app/api/voice`) can't run there, so coaches use the device's built-in
  voices and custom voice cloning is unavailable. Everything else (plans, meals, workouts, settings)
  runs in the browser and saves to the browser's storage.
- To use a hosted backend, add `EXPO_PUBLIC_API_URL` under **Settings → Secrets and variables →
  Actions → Variables**. Never put secret keys in `EXPO_PUBLIC_` variables: they end up in the
  public site.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
