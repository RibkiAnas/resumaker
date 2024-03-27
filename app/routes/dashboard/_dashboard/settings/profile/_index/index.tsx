import { conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import {
	json,
	redirect,
	type LoaderFunctionArgs,
	ActionFunctionArgs,
	AppLoadContext,
} from '@remix-run/cloudflare';
import { Link, useFetcher, useLoaderData } from '@remix-run/react';
import { and, eq, gt, ne } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { ErrorList, Field } from '~/components/forms';
import { Button } from '~/components/ui/button';
import { Icon } from '~/components/ui/icon';
import { StatusButton } from '~/components/ui/status-button';
import { sessions, users, verifications } from '~/drizzle/schema.server';
import { requireUserId, sessionKey } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { validateCSRF } from '~/utils/csrf.server';
import { getUserImgSrc, invariantResponse, useDoubleCheck } from '~/utils/misc';
import { sessionStorage } from '~/utils/session.server';
import { NameSchema, UsernameSchema } from '~/utils/user-validation';
import { twoFAVerificationType } from '../two-factor/_layout';

const ProfileFormSchema = z.object({
	name: NameSchema.optional(),
	username: UsernameSchema,
	// email: EmailSchema,
});

export async function loader({ request, context }: LoaderFunctionArgs) {
	const userId = await requireUserId(request, context);
	const db = buildDbClient(context);

	const user = await db.query.users.findFirst({
		columns: {
			id: true,
			name: true,
			username: true,
			email: true,
		},
		with: {
			image: {
				columns: { id: true },
			},
			sessions: {
				where: gt(sessions.expirationDate, new Date()),
			},
		},
		where: eq(users.id, userId),
	});

	invariantResponse(user, 'User not found', { status: 404 });

	const twoFactorVerification = await db.query.verifications.findFirst({
		columns: { id: true },
		where: and(
			eq(verifications.type, twoFAVerificationType),
			eq(verifications.target, userId)
		),
	});

	return json({ user, isTwoFAEnabled: Boolean(twoFactorVerification) });
}

type ProfileActionArgs = {
	request: Request;
	userId: string;
	formData: FormData;
	context: AppLoadContext;
};
const profileUpdateActionIntent = 'update-profile';
const signOutOfSessionsActionIntent = 'sign-out-of-sessions';
const deleteDataActionIntent = 'delete-data';

export async function action({ request, context }: ActionFunctionArgs) {
	const userId = await requireUserId(request, context);
	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	const intent = formData.get('intent');
	switch (intent) {
		case profileUpdateActionIntent: {
			return profileUpdateAction({ request, userId, formData, context });
		}
		case signOutOfSessionsActionIntent: {
			return signOutOfSessionsAction({ request, userId, formData, context });
		}
		case deleteDataActionIntent: {
			return deleteDataAction({ request, userId, formData, context });
		}
		default: {
			throw new Response(`Invalid intent "${intent}"`, { status: 400 });
		}
	}
}

export default function EditUserProfile() {
	const data = useLoaderData<typeof loader>();

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-12'>
				<div className='flex justify-center'>
					<div className='relative h-[100px] w-[100px]'>
						<img
							src={getUserImgSrc(data.user.image?.id)}
							alt={data.user.username!}
							className='h-full w-full rounded-full object-cover'
						/>
						<Button
							asChild
							variant='outline'
							className='absolute -right-3 top-1 flex h-10 w-10 items-center justify-center rounded-full p-0'
						>
							<Link
								preventScrollReset
								to='photo'
								title='Change profile photo'
								aria-label='Change profile photo'
							>
								<Icon name='camera' className='h-4 w-4' />
							</Link>
						</Button>
					</div>
				</div>
				<UpdateProfile />

				<div className='col-span-6 my-6 h-1 border-b-[1.5px] border-foreground' />
				<div className='col-span-full flex items-center justify-center gap-6'>
					<SignOutOfSessions />
					<DeleteData />
				</div>
			</div>
		</div>
	);
}

async function profileUpdateAction({
	userId,
	formData,
	context,
}: ProfileActionArgs) {
	const db = buildDbClient(context);

	const submission = await parse(formData, {
		async: true,
		schema: ProfileFormSchema.superRefine(async ({ username }, ctx) => {
			const existingUsername = await db.query.users.findFirst({
				columns: { id: true },
				where: eq(users.username, username),
			});

			if (existingUsername && existingUsername.id !== userId) {
				ctx.addIssue({
					path: ['username'],
					code: 'custom',
					message: 'A user already exists with this username',
				});
			}
		}),
	});

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const data = submission.value;

	await db
		.update(users)
		.set({
			name: data.name,
			username: data.username,
		})
		.where(eq(users.id, userId))
		.returning({ username: users.username });

	return json({ status: 'success', submission } as const);
}

function UpdateProfile() {
	const data = useLoaderData<typeof loader>();

	const fetcher = useFetcher<typeof profileUpdateAction>();

	const [form, fields] = useForm({
		id: 'edit-profile',
		constraint: getFieldsetConstraint(ProfileFormSchema),
		lastSubmission: fetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: ProfileFormSchema });
		},
		defaultValue: {
			username: data.user.username,
			name: data.user.name ?? '',
			email: data.user.email,
		},
	});

	return (
		<fetcher.Form method='POST' {...form.props}>
			<AuthenticityTokenInput />
			<div className='grid grid-cols-6 gap-x-10'>
				<Field
					className='col-span-3'
					labelProps={{
						htmlFor: fields.username.id,
						children: 'Username',
					}}
					inputProps={conform.input(fields.username)}
					errors={fields.username.errors}
				/>
				<Field
					className='col-span-3'
					labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
					inputProps={conform.input(fields.name)}
					errors={fields.name.errors}
				/>
			</div>

			<ErrorList errors={form.errors} id={form.errorId} />

			<div className='mt-8 flex justify-center'>
				<StatusButton
					type='submit'
					size='wide'
					name='intent'
					value={profileUpdateActionIntent}
					status={
						fetcher.state !== 'idle'
							? 'pending'
							: fetcher.data?.status ?? 'idle'
					}
					className='w-full'
				>
					Save changes
				</StatusButton>
			</div>
		</fetcher.Form>
	);
}

async function signOutOfSessionsAction({
	request,
	userId,
	context,
}: ProfileActionArgs) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie')
	);
	const sessionId = cookieSession.get(sessionKey);
	invariantResponse(
		sessionId,
		'You must be authenticated to sign out of other sessions'
	);
	const db = buildDbClient(context);
	await db
		.delete(sessions)
		.where(and(eq(sessions.userId, userId), ne(sessions.id, sessionId)));
	return json({ status: 'success' } as const);
}

function SignOutOfSessions() {
	const data = useLoaderData<typeof loader>();
	const dc = useDoubleCheck();

	const fetcher = useFetcher<typeof signOutOfSessionsAction>();
	const otherSessionsCount = data.user.sessions.length - 1;
	return (
		<div>
			{otherSessionsCount ? (
				<fetcher.Form method='POST'>
					<AuthenticityTokenInput />
					<StatusButton
						{...dc.getButtonProps({
							type: 'submit',
							name: 'intent',
							value: signOutOfSessionsActionIntent,
						})}
						variant={dc.doubleCheck ? 'destructive' : 'default'}
						status={
							fetcher.state !== 'idle'
								? 'pending'
								: fetcher.data?.status ?? 'idle'
						}
					>
						<Icon name='avatar'>
							{dc.doubleCheck
								? `Are you sure?`
								: `Sign out of ${otherSessionsCount} other sessions`}
						</Icon>
					</StatusButton>
				</fetcher.Form>
			) : (
				<Icon name='avatar'>This is your only session</Icon>
			)}
		</div>
	);
}

async function deleteDataAction({ userId, context }: ProfileActionArgs) {
	const db = buildDbClient(context);

	await db.delete(users).where(eq(users.id, userId));

	return redirect('/');
}

function DeleteData() {
	const dc = useDoubleCheck();

	const fetcher = useFetcher<typeof deleteDataAction>();
	return (
		<div>
			<fetcher.Form method='POST'>
				<AuthenticityTokenInput />
				<StatusButton
					{...dc.getButtonProps({
						type: 'submit',
						name: 'intent',
						value: deleteDataActionIntent,
					})}
					variant={dc.doubleCheck ? 'destructive' : 'default'}
					status={fetcher.state !== 'idle' ? 'pending' : 'idle'}
				>
					<Icon name='trash'>
						{dc.doubleCheck ? `Are you sure?` : `Delete all your data`}
					</Icon>
				</StatusButton>
			</fetcher.Form>
		</div>
	);
}
