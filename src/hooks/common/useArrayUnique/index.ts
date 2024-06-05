import type { Ref } from 'vue';
import { ref, watchEffect } from 'vue';

// Improved getValueByPath function with added safety checks
function getValueByPath<T>(obj: T, path: string): unknown {
  if (!path || typeof obj !== 'object' || obj === null) return obj;
  return path.split('.').reduce((acc: any, part: string) => acc?.[part], obj);
}

// Optimized generateCompleteKey function
function generateCompleteKey<T>(obj: T): string {
  if (typeof obj !== 'object' || obj === null) return '';
  const sortedObj = Object.entries(obj as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  return JSON.stringify(sortedObj);
}

// Simplified generateKeyFromPaths function
function generateKeyFromPaths<T>(obj: T, paths: string | string[]): string {
  const pathsArray = Array.isArray(paths) ? paths : [paths];
  const values = pathsArray.map(path => getValueByPath(obj, path));
  return values.join('|');
}

// Updated Criteria type to include the 'all' string literal
type Criteria<T> = ((item: T) => string) | string | string[] | 'all';

// Enhanced useArrayUnique hook with improved typing and error handling
export function useArrayUnique<T>(inputArray: T[] | Ref<T[]>, criteria: Criteria<T> = 'all'): Ref<T[]> {
  const uniqueArray = ref<T[]>([]);

  const getArray = () => {
    return Array.isArray(inputArray) ? inputArray : inputArray.value;
  };

  watchEffect(() => {
    const currentArray = getArray();
    if (!Array.isArray(currentArray)) {
      console.error('inputArray must be an array');
      return;
    }

    const uniqueMap = new Map<string, T>();
    for (const item of currentArray) {
      let keyValue: string;

      if (typeof criteria === 'function') {
        keyValue = criteria(item);
      } else if (Array.isArray(criteria)) {
        keyValue = generateKeyFromPaths(item, criteria);
      } else if (criteria === 'all') {
        keyValue = generateCompleteKey(item);
      } else {
        keyValue = String(getValueByPath(item, criteria)); // Safely converting potential undefined to string
      }
      console.log(keyValue, '-:-', item);
      if (!uniqueMap.has(keyValue)) {
        uniqueMap.set(keyValue, item);
      }
      console.log('-:-', uniqueMap);
    }
    uniqueArray.value = Array.from(uniqueMap.values()) as any;

    console.log('-:-', uniqueArray.value.length);
  });

  return uniqueArray as any;
}
