type UserProfile = {
  userhashcode: string
  userid: number
  emplid: string
  username: string
  requestorname: string
  corporate: string
  immediateid: string
  immediatename: string
  immediateemail: string
  sex: string
  position: string
  department: string
}

export const useAuthStorage = () => {
  // Shared state (IMPORTANT)
  const token = useState<string | null>('auth-token', () => null)
  const userProfile = useState<UserProfile | null>('auth-user-profile', () => null)

  const load = (storage: Storage = localStorage) => {
    if (!import.meta.client) return

    token.value = storage.getItem('token')

    const rawProfile = storage.getItem('userProfile')

    console.log('Loading userProfile from storage:', rawProfile)
    if (rawProfile) {
      try {
        userProfile.value = JSON.parse(rawProfile)
        console.log('Parsed userProfile:', userProfile.value)
      } catch (err) {
        console.error('Failed to parse userProfile', err)
        userProfile.value = null
      }
    } else {
      userProfile.value = null
    }
  }

  const save = (newToken: string, profile: UserProfile, storage: Storage = localStorage) => {
    if (!import.meta.client) return

    storage.setItem('token', newToken)
    storage.setItem('userProfile', JSON.stringify(profile))

    token.value = newToken
    userProfile.value = profile
  }

  const clear = (storage: Storage = localStorage) => {
    if (!import.meta.client) return

    storage.removeItem('token')
    storage.removeItem('userProfile')

    token.value = null
    userProfile.value = null
  }

  const isLoggedIn = computed(() => !!token.value)

  return {
    token,
    userProfile,
    isLoggedIn,
    load,
    save,
    clear
  }
}
