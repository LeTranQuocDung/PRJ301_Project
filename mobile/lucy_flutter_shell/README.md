# LUCY Flutter Shell

This project acts as the mobile shell for the LUCY platform. It contains core view layouts, route setups, tab switching, and mock API client flows for demonstration.

---

## Technical Features
* **Authentication Screen**: Standard credential fields and dynamic transitions.
* **Home / Explore**: Language cards listing syllabus content.
* **Live Room**: Dynamic interface representing host rooms.
* **Wallet Perks**: Interactive Sandbox VNPay simulator to credit balances.
* **Podcasts**: Dynamic card items representing recorded episodes.

---

## Build and Code Analysis

1. Ensure you have the Flutter SDK installed on your system.
2. Fetch project dependencies by running:
   ```bash
   flutter pub get
   ```
3. Run code analysis to verify code health and syntax correctness:
   ```bash
   flutter analyze
   ```
4. To build or run the mobile application with environment configurations targeting the Java API backend and the .NET Payment microservice:
   ```bash
   flutter run --dart-define=LUCY_API_BASE=http://localhost:8080/LucyBackendAPI --dart-define=LUCY_PAYMENT_API_BASE=http://localhost:5000
   ```
