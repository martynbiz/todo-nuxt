declare module '#auth-utils' {
  interface UserSession {
    user: {
      id: string
      name: string
      email: string
      theme: string
    }
  }
}

export {}
