/**
 * Text validation utilities for product forms
 */

/**
 * Validates and truncates text to word limit
 * @param text - The text to validate
 * @param wordLimit - Maximum number of words allowed
 * @returns Object with isValid flag and truncated text
 */
export const validateWordLimit = (text: string, wordLimit: number) => {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const isValid = words.length <= wordLimit;
  const truncated = words.slice(0, wordLimit).join(' ');
  
  return {
    isValid,
    truncated,
    currentWordCount: words.length,
    wordLimit,
    message: isValid ? '' : `Maximum ${wordLimit} words allowed. Currently: ${words.length} words.`
  };
};

/**
 * Validates and truncates text to character limit
 * @param text - The text to validate
 * @param charLimit - Maximum number of characters allowed
 * @returns Object with isValid flag and truncated text
 */
export const validateCharLimit = (text: string, charLimit: number) => {
  const isValid = text.length <= charLimit;
  const truncated = text.slice(0, charLimit);
  
  return {
    isValid,
    truncated,
    currentCharCount: text.length,
    charLimit,
    message: isValid ? '' : `Maximum ${charLimit} characters allowed. Currently: ${text.length} characters.`
  };
};

/**
 * Text limits for different fields
 */
export const TEXT_LIMITS = {
  PRODUCT_NAME: {
    WORDS: 20,
    CHARS: 100
  },
  PRODUCT_TITLE: {
    WORDS: 20,
    CHARS: 100
  },
  PRODUCT_DESCRIPTION: {
    WORDS: 200,
    CHARS: 1000
  },
  SPECIFICATION_KEY: {
    WORDS: 100,
    CHARS: 100
  },
  SPECIFICATION_VALUE: {
    WORDS: 100,
    CHARS: 100
  }
} as const;

/**
 * Validates product name
 */
export const validateProductName = (name: string) => {
  return validateWordLimit(name, TEXT_LIMITS.PRODUCT_NAME.WORDS);
};

/**
 * Validates product title
 */
export const validateProductTitle = (title: string) => {
  return validateWordLimit(title, TEXT_LIMITS.PRODUCT_TITLE.WORDS);
};

/**
 * Validates product description
 */
export const validateProductDescription = (description: string) => {
  return validateWordLimit(description, TEXT_LIMITS.PRODUCT_DESCRIPTION.WORDS);
};

/**
 * Validates specification key
 */
export const validateSpecificationKey = (key: string) => {
  return validateWordLimit(key, TEXT_LIMITS.SPECIFICATION_KEY.WORDS);
};

/**
 * Validates specification value
 */
export const validateSpecificationValue = (value: string) => {
  return validateWordLimit(value, TEXT_LIMITS.SPECIFICATION_VALUE.WORDS);
};
