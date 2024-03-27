import { GitHubStrategy } from 'remix-auth-github'
import { z } from 'zod'
import { redirectWithToast } from '../toast.server'
import { type AuthProvider } from './provider'

const GitHubUserSchema = z.object({ login: z.string() })

// const shouldMock = process.env.GITHUB_CLIENT_ID.startsWith('MOCK_')

export class GitHubProvider implements AuthProvider {
	getAuthStrategy() {
		return new GitHubStrategy(
			{
				clientID: "6007133c91fa145f5cb4",
        clientSecret: "de382c811b83ce7075d32e1d31de1f9ce27b2def",
        callbackURL: "http://127.0.0.1:8788/auth/github/callback",
			},
			async ({ profile }) => {
				const email = profile.emails[0].value.trim().toLowerCase()
				if (!email) {
					throw await redirectWithToast('/login', {
						title: 'No email found',
						description: 'Please add a verified email to your GitHub account.',
					})
				}
				const username = profile.displayName
				const imageUrl = profile.photos[0].value
				return {
					email,
					id: profile.id,
					username,
					name: profile.name.givenName,
					imageUrl,
				}
			},
		)
	}

	async resolveConnectionData(providerId: string) {
		try {
      const response = await fetch(`https://api.github.com/user/${providerId}`, {
        headers: { Authorization: 'token 6007133c91fa145f5cb4' },
      })
      const rawJson = await response.json()
      const result = GitHubUserSchema.safeParse(rawJson)
      return {
        displayName: result.success ? result.data.login : 'Unknown',
        link: result.success ? `https://github.com/${result.data.login}` : null,
      } as const
    } catch (error) {
      console.log(error);
      return {
        displayName: 'Unknown',
        link: null,
      } as const
    }
	}

	// async handleMockAction(request: Request) {
	// 	if (!shouldMock) return

	// 	const connectionSession = await connectionSessionStorage.getSession(
	// 		request.headers.get('cookie'),
	// 	)
	// 	const state = createId()
	// 	connectionSession.set('oauth2:state', state)
	// 	const code = 'MOCK_GITHUB_CODE_KODY'
	// 	const searchParams = new URLSearchParams({ code, state })
	// 	throw redirect(`/auth/github/callback?${searchParams}`, {
	// 		headers: {
	// 			'set-cookie':
	// 				await connectionSessionStorage.commitSession(connectionSession),
	// 		},
	// 	})
	// }
}
