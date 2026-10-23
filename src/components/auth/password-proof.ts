import { encryptDataByRsa, generateRandomHexString } from '@/utils/common/tool'

export function passwordProof(password: string): { password: string; salt: string | null } {
  const options = JSON.parse(localStorage.getItem('enableZcAndYzm') || '[]')
  if (
    options.some((v: { name: string; enable_flag: string }) => v.name === 'frontend_res' && v.enable_flag === 'enable')
  ) {
    const salt = generateRandomHexString(16)
    return { password: encryptDataByRsa(password + salt), salt }
  }
  return { password, salt: null }
}
