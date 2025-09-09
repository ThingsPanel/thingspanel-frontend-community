/**
 * @file parameter-editor.ts
 * @description Defines types for the DynamicParameterEditor component.
 */

/**
 * EnhancedParameter - The data structure for a parameter in the dynamic editor.
 * It extends the basic parameter concept with UI-specific properties for different editing modes.
 */
export interface EnhancedParameter {
  /** The parameter key or name. */
  key: string

  /** The parameter value, which can be of any type depending on the context. */
  value: any

  /** Whether the parameter is currently enabled and should be included in the final output. */
  enabled: boolean

  /** The editing mode for the parameter's value. */
  valueMode: 'manual' | 'dropdown' | 'property' | 'component'

  /** The ID of the selected template, if any. */
  selectedTemplate?: string

  /** The data type of the parameter's value. */
  dataType: 'string' | 'number' | 'boolean' | 'json'

  /** The variable name for property binding, automatically generated in most cases. */
  variableName?: string

  /** Unique identifier for Vue tracking (internal use) */
  _id?: string

  /** A user-provided description for the parameter. */
  description?: string

  /** Default value to use when the main value is empty (for property binding) */
  defaultValue?: any

  /** Device selection context (for device-generated parameters) */
  deviceContext?: {
    sourceType: 'device-selection' | 'manual' | 'template'
    selectionConfig?: any
    timestamp: number
  }

  /** Parameter group information (for grouped parameters) */
  parameterGroup?: {
    groupId: string
    role: 'primary' | 'secondary' | 'derived' | 'optional'
    isDerived: boolean
  }
}
