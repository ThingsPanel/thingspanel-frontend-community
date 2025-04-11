# AI Guide: Internationalization (i18n) Files

**Objective:** This document provides a structured guide for AI models interacting with the localization files within this project. Adherence to these guidelines is critical for maintaining i18n consistency.

## 1. Core Directory

-   **Path:** `src/locales/langs/`
-   **Contents:** Contains all language pack definitions for the application.

## 2. File Naming Convention

-   Each language pack is defined in a primary TypeScript file.
-   **Format:** `<language_code>-<region_code>.ts`
    -   `language_code`: Lowercase ISO 639-1 code (e.g., `en`, `zh`).
    -   `region_code`: Uppercase ISO 3166-1 alpha-2 code (e.g., `US`, `CN`).
-   **Examples:** `en-us.ts` (American English), `zh-cn.ts` (Simplified Chinese).

## 3. Main Language File Structure (`<lang>-<region>.ts`)

-   **Export:** Each file exports a single `default` JavaScript object.
-   **Content:** This object contains key-value pairs representing translation strings.
-   **Keys:**
    -   Strings representing unique identifiers for translatable text.
    -   Organized hierarchically using nested objects (e.g., `module.page.section.key`).
    -   **CRITICAL:** The **exact same key structure** (nesting and key names) MUST exist across ALL main language files (`en-us.ts`, `zh-cn.ts`, etc.).
-   **Values:**
    -   Strings containing the translated text for the target language corresponding to the file.
    -   These are the ONLY parts that differ between language files for the same key.

-   **Example (`zh-cn.ts`):**
    ```typescript
    export default {
      common: {
        confirm: '确认',
        cancel: '取消',
      },
      page: {
        login: {
          title: '登录',
          usernamePlaceholder: '请输入用户名',
        }
      }
    };
    ```
-   **Corresponding Example (`en-us.ts`):**
    ```typescript
    export default {
      common: {
        confirm: 'Confirm', // Translated value
        cancel: 'Cancel',   // Translated value
      },
      page: {
        login: {
          title: 'Login',                    // Translated value
          usernamePlaceholder: 'Enter username', // Translated value
        }
      }
    };
    ```

## 4. Language Subdirectories (`<lang>-<region>/`)

-   **Path:** `src/locales/langs/<language_code>-<region_code>/` (e.g., `src/locales/langs/en-us/`)
-   **Current Status:** These directories exist but may be empty.
-   **Purpose (Potential):** Reserved for future modularization. If implemented, language strings might be split into smaller files within these directories (e.g., `src/locales/langs/en-us/common.ts`, `src/locales/langs/en-us/login.ts`) and potentially aggregated back in the main language file or loaded dynamically. Assume main file structure unless specific instructions indicate otherwise.

## 5. AI Interaction Protocols

### 5.1 Adding or Modifying Translations

1.  **Identify Key:** Determine the hierarchical key (e.g., `page.settings.profile.updateButton`).
2.  **Locate Files:** Identify ALL main language files (e.g., `en-us.ts`, `zh-cn.ts`).
3.  **Update ALL Files:**
    -   Navigate to the correct position within the nested object structure based on the key.
    -   **If Modifying:** Change the string *value* associated with the key in EACH file.
    -   **If Adding:** Add the new key-value pair at the correct position in EACH file, ensuring the key and structure are identical across all files. Provide the translated string value appropriate for each file.
    -   **CRITICAL:** Never change key names or the object structure in one file without applying the identical structural change to ALL other language files.

### 5.2 Adding a New Language (e.g., `fr-fr`)

1.  **Create Main File:** Generate `src/locales/langs/fr-fr.ts`.
2.  **Copy Structure:** Duplicate the **entire object structure and all keys** from an existing language file (e.g., `en-us.ts`) into `fr-fr.ts`.
3.  **Translate Values:** Replace **only the string values** in `fr-fr.ts` with the French translations. Do not modify keys.
4.  **Register Language:** Modify the language registration mechanism (likely located in `src/locales/index.ts` or a similar central i18n configuration file) to import and include the new `fr-fr` language pack. *Requires inspecting the registration file.*
5.  **(If Applicable) Create Subdirectory:** Create `src/locales/langs/fr-fr/`. If modularization is used, replicate the subdirectory structure and translate values in corresponding sub-files.

## 6. Critical Constraints Summary for AI

-   **Key Structure Consistency:** Absolute requirement. All main language files MUST share the identical nested key structure.
-   **Value-Only Translation:** When translating or adding a language, modify ONLY the string values. Keys and structure remain constant.
-   **Universality of Keys:** Any key existing in one language file MUST exist in all others.
-   **File Naming:** Strictly follow `<language_code>-<region_code>.ts`.

## 7. Translation Rules and Guidelines for IIoT

These rules supplement the general protocols and are specific to the Industrial Internet of Things (IIoT) domain of this product. Adherence is crucial for maintaining accuracy and clarity for technical users.

### 7.1 Terminology Consistency (Highest Priority)
-   **One Term, One Translation:** A specific technical term (e.g., `Telemetry`, `Gateway`, `PLC`, `Setpoint`, `Data Point`) MUST be translated consistently throughout the entire application for a given target language.
-   **Check Existing Terms:** Before translating a new UI text or message containing a technical term, ALWAYS check the existing language files (`en-us.ts`, `zh-cn.ts`, etc.) to see if that term or a similar one has already been translated. Use the existing translation.
-   **Glossary (Implicit):** The language files serve as an implicit glossary. Do not introduce variations for established terms.
-   **Specific Term Preferences:**
    *   **Use `Alert` instead of `Alarm`:** Apply globally (e.g., `Alarm Status` -> `Alert Status`, `Alarm History` -> `Alert History`, `Alarm Rules` -> `Alert Rules`, `Low Alarm` -> `Low Alert`). The goal is UI consistency, even if `Alarm` might describe device state slightly better in some contexts.
    *   **Use `Action` instead of `Operation`:** Especially for the 'Actions' column in tables and for manual interventions.
    *   **Use `Save` instead of `Confirm`:** For buttons that save changes. Use `Cancel` for cancellation.
    *   **`Create` / `Add` / `New` Usage:**
        *   **`Create` (Primary):** For main resources (e.g., `Create Device`, `Create Rule`, `Create Template`, `Create Alert`, `Create Board`, `Create Automation`).
        *   **`Add` (Specific):** For adding to existing collections (e.g., `Add Tag`, `Add Member`, `Add Property`, `Add Action`, `Add Data Processing Rule`, `Add Extended Information`, `Add Device to Group`, `Add Component`).
        *   **`New` (Limited):** Primarily for UI button text (e.g., `New Device` button), avoid in API/docs.
    *   **Use `Integration(s)` instead of `Device Service`/`Service Access`:** Refers to connecting external services or protocols. (e.g., Menu: `Integrations`).
    *   **Use `Desired State` instead of `Expect Message`:** Standard IoT term for the intended state of a device.
    *   **Use `Telemetry` instead of `Report Data`:** When referring to data sent from a device (e.g., `Simulate Telemetry`).
    *   **Use `Send Command` instead of `Issue Control`/`Issue Command`/`Distribute`:** For actions sending commands to devices.
    *   **Use `Update Attribute` instead of `Issue Attribute`:** For actions changing device attributes/properties.
    *   **Use `Payload` instead of `Data Example`/`Event Content`/`Command Content`:** For the data structure being sent or received.
    *   **Use `Operator` instead of `Operation Users`:** For the user performing an action.
    *   **Use `Profile` instead of `Personal Center`:** For the user's profile page/menu.
    *   **Use `Mobile` instead of `Phone Number`:** For user contact information.

### 7.2 Clarity and Industry Standards
-   **Prioritize Meaning:** Translate technical terms for maximum clarity to the target audience (engineers, operators, technicians). Avoid overly literal translations if a standard, well-understood industry term exists in the target language.
-   **Use Standard Terms:** If an official or de facto standard translation for an IIoT concept exists in the target language, use it (e.g., `Modbus`, `OPC-UA`).
-   **Specific Term Preferences:**
    *   MQTT: Use `Broker Address` (not `Access Address`), `Client ID` (consistent casing).
    *   Time: Use `Timestamp` or `Event Time` (not `Event Reporting Time`); `Command Time` (not `Command issuance time`); `Expiry Time` or `Expires At` (not `Expire Time`); `Processed At` (not `Deal Time`); `Created At` (not `Create Time`/`Creation time`); `Last Report Time` (not `Last Push Time`).
    *   Device Details Tabs/Sections: Use `Connection Details` (not `Join J.I.O.N`); `Attributes` (not `States`); `Events` (not `Event Report`); `Commands` (not `Commander`); `Alerts` (consistent with 7.1); `Extended Details` or `Additional Details` (not `Extension Info`/`Message`); `Device Settings` (not `Devices Setting Up`).
    *   Configuration/Template/Model: Use `Device Template` (not `Device Configuration`); Use `Device Model` (not `Device Function Template`).
    *   Configuration Naming: Use `Connection Configuration` (not `Protocol Configuration`).
    *   Data Processing: Use `Data Processing Rule` (not `Data Processing`); Use `Processing Script` (not `Parse Script`).

### 7.3 Placeholder Preservation
-   Placeholders within strings (e.g., `{deviceName}`, `${count}`, `%s`, `{unit}`) MUST be preserved in the translated value.
-   Ensure the placeholder's position is grammatically correct in the target language sentence structure.
-   Example: `en: 'Sensor {sensorName} reading: {value} {unit}'` -> `zh: '传感器 {sensorName} 读数：{value} {unit}'`

### 7.4 Units and Technical Formatting
-   **Units:** Units of measurement (e.g., `°C`, `kPa`, `RPM`, `m/s`, `A`, `V`) generally remain untranslated but should follow the value according to target language conventions. They MUST be included if present in the source string. Ensure full unit names are used where appropriate (e.g., `hours` not `hour` after a number > 1).
-   **Numeric/Date/Time:** Do not embed locale-specific number or date/time formats directly into translation strings. This should be handled by formatting libraries based on the active locale.

### 7.5 Acronyms and Abbreviations
-   **Common Acronyms:** Widely recognized international IIoT acronyms (e.g., `PLC`, `SCADA`, `MQTT`, `API`, `IoT`) can often be kept as-is, unless a very common and standard translation exists and is preferred in the target technical community.
-   **Consistency Check:** If unsure, check existing translations or keep the acronym.

### 7.6 UI Element Labels (Buttons, Menus)
-   **Conciseness:** Keep labels short and action-oriented (e.g., `Save`, `Enable`, `Acknowledge Alert`, `Add Device`, `Create Group`).
-   **Accuracy:** Ensure the verb/noun choice accurately reflects the action in the IIoT context.
-   **Placeholders:** Use specific placeholders (e.g., `Enter name`, `Enter description`) instead of generic ones like `请输入`.
-   **Consistency:** Use consistent casing (e.g., Sentence case or Title Case) for all menus and buttons. Remove unnecessary suffixes like `List` from menu items.
-   **Specific Label Preferences:**
    *   Device List Status: Use `Status` (not `Online Status`); Use `Normal` (not `Not Alarmed`); Use `All Statuses` (not `All Status`).
    *   Automation/Scene: Use `Automation(s)` for rules/linkage; Use `Scenes` for state management.
    *   Alarm Sub-menu: Use `Alert Record`, `Alert Groups`, `Alert Center`.
    *   Product Menu: Use `Products`; Use `OTA`, `Upgrade Packages`.
    *   Search/Filter: Remove unnecessary `Any`; Use `Select Group`, `All Device Templates`, `Status`, `Alert Status`, `Protocol/Integration`; Use specific `Onboarding Type` translations (`Direct Device`, `Gateway`, `Sub-device`).

### 7.7 Status, Logs, and Notifications
-   **Clarity:** Messages related to device status (`Online`, `Offline`, `Error`, `Running`, `Stopped`), events, logs, and alerts must be unambiguous. Consider if `handled` -> `Acknowledged`/`Closed` or `untreated` -> `Active`/`Unacknowledged` are clearer in context.
-   **Context:** Provide sufficient context in error messages (e.g., `Failed to apply configuration to {deviceName}` is better than `Configuration failed`).
-   **Result/Status:** Use `Status` or `Result` (not `Send Results`); Use `Status Message` (not `Status Info`); Fix hyphen in `Error-Message` -> `Error Message`.

### 7.8 Contextual Translation
-   Generic terms like `Value`, `Data`, `Parameter`, `Tag` MUST be translated based on their specific context.
    -   Example: `Sensor Value`, `Configuration Parameter`, `Data Point Tag`. Use the context provided by the hierarchical key or surrounding user interface elements.

### 7.9 Pluralization and Gender (Awareness)
-   The current key-value structure might not inherently support complex pluralization or grammatical gender rules found in some languages.
-   Translate singular forms accurately. If pluralization issues arise, they may need to be addressed via specific code changes or advanced i18n library features, potentially requiring separate keys (e.g., `device.count.singular`, `device.count.plural`). Translate based on the provided key.
-   Ensure plurals are used correctly where applicable (e.g., `10 Devices` not `10 IndividualDevice`). 