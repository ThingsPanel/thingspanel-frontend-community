export default {
  required: 'Cannot be empty',
  userName: {
    required: 'Please enter username',
    invalidFormat: 'Invalid username format',
    lenMin6: 'Username must be at least 6 characters',
    tip: 'Username must be at least 6 characters'
  },
  phone: {
    required: 'Please enter phone number',
    invalid: 'Invalid phone number format',
    lenMin6: 'Phone number must be at least 6 characters', // Assuming length check is desired
    tip: 'Phone number must be at least 6 characters'
  },
  pwd: {
    required: 'Please enter password',
    invalid: 'Invalid password format',
    lenMin6: 'Password must be at least 6 characters and contain lowercase letters',
    tip: 'Password must be at least 6 characters and contain lowercase letters'
  },
  code: {
    required: 'Please enter verification code',
    invalid: 'Invalid verification code format',
    lenMin6: 'Verification code must be at least 6 characters', // Assuming length check is desired
    tip: 'Verification code must be at least 6 characters'
  },
  email: {
    required: 'Please enter email',
    invalid: 'Invalid email format',
    lenMin6: 'Email must be at least 6 characters', // Assuming length check is desired
    tip: 'Email must be at least 6 characters'
  },
  manycheck: {
    required: 'Passwords do not match',
    invalid: 'Passwords do not match',
    lenMin6: 'Input must be at least 6 characters',
    tip: 'Input must be at least 6 characters'
  }
};
