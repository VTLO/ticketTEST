# Mreso Android Build

This repository contains the source code for the Mreso Android application, built with React, Vite, and Capacitor.

## How to build the APK using GitHub Actions (Fastlane)

1.  **Push your code** to the `main` branch.
2.  **Go to the "Actions" tab** in your GitHub repository.
3.  Select the **"Build Android APK with Fastlane"** workflow.
4.  If you want to run it manually, click **"Run workflow"**.
5.  Once the build is complete, you can download the APK from the **"Artifacts"** section of the workflow run.

## Prerequisites for the build

To ensure the AI verification feature works in the APK, you **MUST** add your Gemini API key to your GitHub repository secrets:

1.  Go to your repository **Settings** > **Secrets and variables** > **Actions**.
2.  Click **"New repository secret"**.
3.  Name it `GEMINI_API_KEY`.
4.  Paste your API key as the value.

The GitHub Action will automatically pick up this secret and bake it into the build. The build uses **Java 22** as the minimum required version.

## Local Development (Fastlane)

To build the APK locally using Fastlane:

1.  `npm install`
2.  `npm run build`
3.  `npx cap sync`
4.  `bundle install`
5.  `bundle exec fastlane build`

The APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.
