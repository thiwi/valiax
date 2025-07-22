# Luma iOS Example

This directory contains a minimal SwiftUI application for **Luma** using mocked data. The app lists sample validation rules and displays their details.

## Structure
- `Package.swift` – Swift Package manifest describing the app.
- `Sources/LumaIOS` – SwiftUI source files and mocked data.
- `Tests` – Basic unit test verifying mock data loading.

## Running
Open this folder in Xcode 15 or later and build the `LumaIOS` target.

The project uses a JSON file `MockRules.json` bundled as a resource to provide mock rules. The `RuleListViewModel` loads this data on startup.
