English | [中文](./README_ZH.md)
## Project introduction
ThingsPanel is a **lightweight, componentized** open-source IoT application support platform, designed to reduce development efforts and accelerate IoT project construction through reusable plugins.

## Key Plugins
- **Device Function Templates**: Integrates physical models with charts.
- **Device Configuration Templates**: Combines device function templates with protocol plugins.
- **Protocol Access Plugins**: Addresses various protocol access issues.
- **Service Access Plugins**: Allows device access through third-party platforms.
- **Dashboard Cards**: Extends dashboard display capabilities.
- **Visualization Plugins**: Expands functionality for large-screen visualization.
- **Dependency Plugins**: Building blocks for industry solutions.

Using these plugins **repeatedly** can greatly improve R&D efficiency.

## Usage Examples
1. [Connecting Humidity and Temperature Sensors to ThingsPanel-v1.0.0 via Youman M300 Gateway using MQTT](https://www.thingspanel.cn/posts/80)
2. [Fox-Shifu Integration with ThingsPanel](https://bianwuji.feishu.cn/docx/LQS4dyVf4o5WMrxzPlKcP5Ftnpg)
3. [Fox-Edge IoT Edge Computing Platform Integration with ThingsPanel](http://docs.fox-tech.cn/#/fox-edge-3rd-cloud-thingspanel)
4. [Controlling Fan Speed with ThingsPanel via ESP8266](http://thingspanel.cn/posts/72)
5. [Measuring Atmospheric Pressure with ESP-8266 and BMP280 Sensor - ThingsPanel](http://thingspanel.cn/posts/71)

## Product Screenshots
Desktop Interface
<div align="center">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/tp-1.0.0-homepage.png" width="45%" alt="Homepage">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/tp-1.0.0-devicelist.png" width="45%" alt="Device List">
</div>
<div align="center">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/tp-1.0.0-telemetry.png" width="90%" alt="Telemetry Data">
</div>
Dynamic Effect Demonstration
<div align="center">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/weatherstation-800.gif" width="42%" alt="Weather Station">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/electric2-s.gif" width="50%" alt="Power System">
</div>
<div align="center">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/huanrezhan.gif" width="92.5%" alt="Heat Exchange Station">
</div>
Mobile Application Interface
<div align="center">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/tp-app-login.webp" width="30%" alt="Mobile App Login">
  <img src="https://pub-dd72232484fd4c78b094868481918d04.r2.dev/tp-app.webp" width="30%" alt="Mobile App">
</div>

## Demo
URL: http://demo.thingspanel.cn

Account: test@test.cn

Password: 123456

## Product Applications
- Unified device management
- IoT middleware Platform
- Device vendor management backend

## Problem Solving
- **Enthusiasts**: An open architecture that unleashes the joy of creation.
- **System Integrators**: A single platform delivers all smart projects.
- **Solution Providers**: Saves time and costs to quickly achieve business objectives.
- **Device Vendors**: Focus solely on making good devices without worrying about the software.
- **End Customers**: A single platform for all device integrations, enabling an IoT data platform.

## Unique Advantages
- **Ease of Use**: Simplifies IoT, making it more understandable.
- **Compatibility**: Compatible with various device protocols, reducing system expansion costs.
- **Componentization**: Open architecture, multiple component design, quick setup.

## Feature Overview
- **Multitenancy**: Super admin management, tenant account management systems, tenant users manage devices and view data.
- **Device Access**: Edit and create projects, manage devices by groups, view device push status, access devices via plugins, gateway and sub-device access, Modbus RTU/TCP protocol access, TCP protocol access, GB28181 security camera access, custom protocol plugin access.
- **Monitoring Dashboard**: Monitor charts after adding devices, set dashboard as menu or homepage, create multiple dashboards.
- **Device Function Templates**: Set physical models, Web and App charts, can export to JSON.
- **Device Configuration Templates**: Associate devices, attributes, and functions, protocol configurations, data processing, automation, alerts, extended information, device settings, one-type-one-secret settings.
- **Device Map**: Filter devices by project and group, filter by device type.
- **Visualization**: Basic visualization editing, open architecture, pre-bound data charts, add your own graphics, loosely coupled with the system, supports SCADA, large screens, 3D, Three.js.
- **Product Management**: Create products, bulk management, QR code data, manual activation, pre-registration management.
- **Firmware Upgrade**: Add firmware to products, create upgrade tasks, firmware upgrade reports.
- **Automation**: Scene linkage, scene logs, timer triggers, device triggers, various triggers.
- **Alarm Information**: Show alarms by project and group, filter by time period.
- **Notification Features**: SMS, email, phone, webhook notifications.
- **System Logs**: IP access paths, device operation records.
- **Application Management**: Device plugin management, plugin generator, plugin installation, app market.
- **Protocol Access**: Develop custom protocol configurations, configuration after access parameters.
- **Service Access**: Access devices through third-party platforms.
- **User Management**: Casbin scheme, page permission control, project permission control, multiple role definitions.
- **Rule Engine**: Data forwarding to third parties, receiving device data and converting, accessing various protocols, real-time data calculations.
- **Data Gateway**: OpenAPI, database SQL-to-HTTP, interfacing with third-party systems, IP and data range restrictions, authorized reading.
- **System Settings**: Change logo, system title, theme style.
- **IoT App**: Uniapp development, scan to add devices, view monitoring values, switch projects and device groups, manual control, set control policies, view operation logs, manage personal accounts, mobile verification code login.
- **Dependency Plugins**: Dependency plugins for industry solutions, based on device plugins and other features and data, visualization invocation, iframe code inclusion, plugin reuse.

## Frontend Tech Stack
* **TypeScript**: A strongly-typed programming language that builds on JavaScript.
* **Vue.js (3)**: An easy-to-learn frontend framework.
* **Vite**: A frontend development and build tool.
* **vue-router**: The official router manager for Vue.js.
* **pinia**: The next-generation state management library for Vue.js, offering a simpler and more user-friendly API compared to Vuex.
* **naive-ui**: A UI component library for Vue 3.
* **vue-echarts**: The Vue component for ECharts, integrating Baidu's ECharts chart library.
* **@antv/g2**: A data visualization chart library.
* **@vicons**: Vue component wrappers for multiple icon libraries, supporting Ant Design, Carbon, Fluent, Ionicons, etc.
* **axios**: A library for making HTTP requests.
* **socket.io-client**: Provides WebSocket encapsulation.

## Frontend Developer Guide
1. Recommended IDE: **VSCode**. Install the following plugins to enhance the development experience:
    - Vetur: Syntax highlighting and intelligent hints for Vue.js.
    - ESLint: Code checking plugin for JavaScript and TypeScript.
    - Prettier: Code formatting tool.
    - Volar: Enhanced support plugin for Vue 3.
    - Vite: Support plugin for the Vite toolchain.
2. **Clone the project**.
3. **Install Dependencies**.
  Install Node.js and pnpm:
  `npm install -g pnpm`, 
  Install project dependencies:
  `pnpm install`.
4. **Start the Development Server**.
  `pnpm dev` or `npm run dev`.
5. **Create a Branch for Development**.
  Pull a branch from the main branch to start development.
6. **Local Code Checking**.
  Code checks will be triggered automatically when committing code, but you can also manually run the checks:
     - `pnpm lint` Run ESLint for code checking;
     - `pnpm typecheck` Run TypeScript type checking;
     - `pnpm format` Format the code.
1. CI/CD with GitHub Actions, 
  **Ensure that the CI/CD checks pass and make necessary modifications if needed**.
2. **Submit a Pull Request**
  After committing code, submit a pull request and wait for review.
3. Merge Code into the Main Branch
  Once the code review is approved, the code will be merged into the main branch.
4. Automatic Deployment
  Code merged into the main branch will be automatically deployed to the production environment.

## API Documentation Link
[API Documentation](https://docs.qq.com/doc/DZVZKc2FCTE1EblBX)

## Licensing and Commercial Licensing
ThingsPanel is now released under the Apache License 2.0. This is a permissive open-source license that allows users:

Permissive Use: Can be used in private or commercial environments without requiring derivative works to be open-sourced
Freedom to Modify: Allows modification and redistribution of source code
Patent Grant: Contributors automatically grant users necessary patent rights
Copyright Notice Required: Must retain copyright notices and license terms
While Apache 2.0 already allows commercial use, we also provide Enterprise Edition, Customized Support Services, and Enhanced Feature Licensing for enterprise customers to meet higher production-grade requirements, including but not limited to:

Enterprise-level technical support and deployment consulting
Custom development and integration services
Security hardening, private deployment, and SLA support
Brand customization and OEM licensing
If you wish to obtain more commercial support or customized services, please contact us.

## Community and Support

QQ Group 1: 260150504 (Full)

QQ Group 2: 371794256

## Acknowledgments
Thank you for your contributions to ThingsPanel!
Special thanks to [paddy235](https://gitee.com/paddy235) for developing the ThingsPanel simulation test script, which can be used for simulation and stress testing. The script is available at: [ThingsPanel Simulation Test Script](https://gitee.com/paddy235/thingspanel_simulation_python).

![Contributors](https://contrib.rocks/image?repo=ThingsPanel/ThingsPanel-Go)


