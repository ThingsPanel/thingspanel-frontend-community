English | [中文](./README.md)
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
![System Architecture](http://thingspanel.io/assets/images/ThingsPanel-0.6.0-homepage-27308c5423090237c9e13e5560b7162e.png)

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
  `pnpm install`
4. **Start the Development Server**.
  `pnpm dev` or `npm run dev`.
5. **Create a Branch for Development**.
  Pull a branch from the main branch to start development.
6. **Local Code Checking**.
  Code checks will be triggered automatically when committing code, but you can also manually run the checks:
     - `pnpm lint` Run ESLint for code checking
     - `pnpm typecheck` Run TypeScript type checking
     - `pnpm format` Format the code
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

ThingsPanel is released under the [GNU Affero General Public License version 3 (AGPLv3)](https://www.gnu.org/licenses/agpl-3.0.html), which allows you to download, use, and modify the code, provided that any modified versions are also released under the same license, and if you run the modified program over a network, you must provide the source code to the network users.

For users who wish to use ThingsPanel in a commercial setting, we offer commercial licensing options. Commercial licensing allows you to use ThingsPanel without fully adhering to the open-source license requirements of AGPLv3, for example, using ThingsPanel without disclosing the source code to end-users. This provides greater flexibility and confidentiality for businesses.

If you are interested in commercial licensing, or need more information, please contact us at [Commercial Licensing Inquiry](mailto:zjh@jiyikeji.cn), or join our WeChat or QQ group to speak with our business team. We will provide detailed licensing options to meet your business needs.

## Community and Support

QQ Group 1: 260150504 (Full)

QQ Group 2: 371794256

## Acknowledgments
Thank you for your contributions to ThingsPanel!
Special thanks to [paddy235](https://gitee.com/paddy235) for developing the ThingsPanel simulation test script, which can be used for simulation and stress testing. The script is available at: [ThingsPanel Simulation Test Script](https://gitee.com/paddy235/thingspanel_simulation_python).

![Contributors](https://contrib.rocks/image?repo=ThingsPanel/ThingsPanel-Go)


