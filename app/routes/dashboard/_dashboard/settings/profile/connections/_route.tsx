import { Form, useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { Icon } from '~/components/ui/icon'
import { StatusButton } from '~/components/ui/status-button'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { requireUserId } from '~/utils/auth.server'
import { resolveConnectionData } from '~/utils/connections.server'
import { ProviderNameSchema } from '~/utils/connections'
import { invariantResponse, useIsPending } from '~/utils/misc'
import { createToastHeaders } from '~/utils/toast.server'
import { ActionFunctionArgs, AppLoadContext, LoaderFunctionArgs, SerializeFrom, json } from '@remix-run/cloudflare'
import { buildDbClient } from '~/utils/client'
import { connections as connectionsTable, users } from '~/drizzle/schema.server'
import { and, eq } from 'drizzle-orm'

export const handle = {
	breadcrumb: <Icon name="link-2">Connections</Icon>,
}

async function userCanDeleteConnections(context: AppLoadContext, userId: string) {
  const db = buildDbClient(context)
	const user = await db.query.users.findFirst({
    with: {
      password: {
        columns: { userId: true }
      },
      connections: {
        columns: { id: true },
      }
    },
		where: eq(users.id, userId),
	})
	// user can delete their connections if they have a password
	if (user?.password) return true
	// users have to have more than one remaining connection to delete one
	return Boolean(user?.connections && user?.connections.length > 1)
}

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context)
  const db = buildDbClient(context)
	const rawConnections = await db.query.connections.findMany({
		columns: { id: true, providerName: true, providerId: true, createdAt: true },
		where: eq(connectionsTable.userId, userId),
	})

	const connections: Array<{
		id: string
		displayName: string
		link?: string | null
		createdAtFormatted: string
	}> = []
	for (const connection of rawConnections) {
		const r = ProviderNameSchema.safeParse(connection.providerName)
		if (!r.success) continue
		const connectionData = await resolveConnectionData(
			r.data,
			connection.providerId,
		)
    console.log(connectionData);
    
		if (connectionData) {
			connections.push({
				...connectionData,
				id: connection.id,
				createdAtFormatted: connection.createdAt!.toLocaleString(),
			})
		} else {
			connections.push({
				id: connection.id,
				displayName: 'Unknown',
				createdAtFormatted: connection.createdAt!.toLocaleString(),
			})
		}
	}

	return json({
		connections,
		canDeleteConnections: await userCanDeleteConnections(context, userId),
	})
}

export async function action({ request, context }: ActionFunctionArgs) {
	const userId = await requireUserId(request, context)
	const formData = await request.formData()
	invariantResponse(
		formData.get('intent') === 'delete-connection',
		'Invalid intent',
	)
	invariantResponse(
		await userCanDeleteConnections(context, userId),
		'You cannot delete your last connection unless you have a password.',
	)
	const connectionId = formData.get('connectionId')
	invariantResponse(typeof connectionId === 'string', 'Invalid connectionId')
  const db = buildDbClient(context)

	await db.delete(connectionsTable)
		.where(and(
      eq(connectionsTable.id, connectionId),
      eq(connectionsTable.userId, userId),
    ))
	const toastHeaders = await createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	return json({ status: 'success' } as const, { headers: toastHeaders })
}

export default function Connections() {
	const data = useLoaderData<typeof loader>()
	const isGitHubSubmitting = useIsPending({ formAction: '/auth/github' })

	return (
		<div className="mx-auto max-w-md">
			{data.connections.length ? (
				<div className="flex flex-col gap-2">
					<p>Here are your current connections:</p>
					<ul className="flex flex-col gap-4">
						{data.connections.map(c => (
							<li key={c.id}>
								<Connection
									connection={c}
									canDelete={data.canDeleteConnections}
								/>
							</li>
						))}
					</ul>
				</div>
			) : (
				<p>You don&apos;t have any connections yet.</p>
			)}
			<Form
				className="mt-5 flex items-center justify-center gap-2 border-t-2 border-border pt-3"
				action="/auth/github"
				method="POST"
			>
				<StatusButton
					type="submit"
					className="w-full"
					status={isGitHubSubmitting ? 'pending' : 'idle'}
				>
					<Icon name="github-logo">Connect with GitHub</Icon>
				</StatusButton>
			</Form>
		</div>
	)
}

function Connection({
	connection,
	canDelete,
}: {
	connection: SerializeFrom<typeof loader>['connections'][number]
	canDelete: boolean
}) {
	const deleteFetcher = useFetcher<typeof action>()
	const [infoOpen, setInfoOpen] = useState(false)
	return (
		<div className="flex justify-between gap-2">
			<Icon name="github-logo">
				{connection.link ? (
					<a href={connection.link} className="underline">
						{connection.displayName}
					</a>
				) : (
					connection.displayName
				)}{' '}
				({connection.createdAtFormatted})
			</Icon>
			{canDelete ? (
				<deleteFetcher.Form method="POST">
					<input name="connectionId" value={connection.id} type="hidden" />
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<StatusButton
									name="intent"
									value="delete-connection"
									variant="destructive"
									size="sm"
									status={
										deleteFetcher.state !== 'idle'
											? 'pending'
											: deleteFetcher.data?.status ?? 'idle'
									}
								>
									<Icon name="cross-1" />
								</StatusButton>
							</TooltipTrigger>
							<TooltipContent>Disconnect this account</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</deleteFetcher.Form>
			) : (
				<TooltipProvider>
					<Tooltip open={infoOpen} onOpenChange={setInfoOpen}>
						<TooltipTrigger onClick={() => setInfoOpen(true)}>
							<Icon name="question-mark-circled"></Icon>
						</TooltipTrigger>
						<TooltipContent>
							You cannot delete your last connection unless you have a password.
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	)
}
