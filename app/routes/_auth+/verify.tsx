import { Submission, conform, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import { generateTOTP, verifyTOTP } from '@epic-web/totp';
import {
	ActionFunctionArgs,
	AppLoadContext,
	LoaderFunctionArgs,
	json,
} from '@remix-run/cloudflare';
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { z } from 'zod';
import { ErrorList, Field } from '~/components/forms';
import { Spacer } from '~/components/spacer';
import { StatusButton } from '~/components/ui/status-button';
import { verifications } from '~/drizzle/schema.server';
import { buildDbClient } from '~/utils/client';
import { validateCSRF } from '~/utils/csrf.server';
import { getDomainUrl, useIsPending } from '~/utils/misc';
import { createId } from '@paralleldrive/cuid2';
import { handleVerification as handleOnboardingVerification } from './onboarding';
import { handleVerification as handleResetPasswordVerification } from './reset-password';
import { handleVerification as handleChangeEmailVerification } from '../dashboard/_dashboard/settings/profile/change-email/_route';
import {
	handleVerification as handleLoginTwoFactorVerification,
	shouldRequestTwoFA,
} from './login';
import { twoFAVerifyVerificationType } from '../dashboard/_dashboard/settings/profile/two-factor/verify/_route';
import { GeneralErrorBoundary } from '~/components/error-boundary';
import { twoFAVerificationType } from '../dashboard/_dashboard/settings/profile/two-factor/_layout';
import { redirectWithToast } from '~/utils/toast.server';

export const codeQueryParam = 'code';
export const targetQueryParam = 'target';
export const typeQueryParam = 'type';
export const redirectToQueryParam = 'redirectTo';

const types = ['onboarding', 'reset-password', 'change-email', '2fa'] as const;
const VerificationTypeSchema = z.enum(types);
export type VerificationTypes = z.infer<typeof VerificationTypeSchema>;

const VerifySchema = z.object({
	[codeQueryParam]: z.string().min(6).max(6),
	[typeQueryParam]: VerificationTypeSchema,
	[targetQueryParam]: z.string(),
	[redirectToQueryParam]: z.string().optional(),
});

export async function loader({ request, context }: LoaderFunctionArgs) {
	const params = new URL(request.url).searchParams;
	if (!params.has(codeQueryParam)) {
		// we don't want to show an error message on page load if the otp hasn't be
		// prefilled in yet, so we'll send a response with an empty submission.
		return json({
			status: 'idle',
			submission: {
				intent: '',
				payload: Object.fromEntries(params) as Record<string, unknown>,
				error: {} as Record<string, Array<string>>,
			},
		} as const);
	}
	return validateRequest(request, context, params);
}

export async function action({ request, context }: ActionFunctionArgs) {
	const formData = await request.formData();
	await validateCSRF(formData, request.headers);
	return validateRequest(request, context, formData);
}

export function getRedirectToUrl({
	request,
	type,
	target,
	redirectTo,
}: {
	request: Request;
	type: VerificationTypes;
	target: string;
	redirectTo?: string;
}) {
	const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`);
	redirectToUrl.searchParams.set(typeQueryParam, type);
	redirectToUrl.searchParams.set(targetQueryParam, target);
	if (redirectTo) {
		redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo);
	}
	return redirectToUrl;
}

export async function requireRecentVerification({
	request,
	context,
	userId,
}: {
	request: Request;
	context: AppLoadContext;
	userId: string;
}) {
	if (await shouldRequestTwoFA({ request, context, userId })) {
		const reqUrl = new URL(request.url);
		const redirectUrl = getRedirectToUrl({
			request,
			target: userId,
			type: twoFAVerificationType,
			redirectTo: reqUrl.pathname + reqUrl.search,
		});
		throw await redirectWithToast(redirectUrl.toString(), {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		});
	}
}

export async function prepareVerification({
	period,
	request,
	context,
	type,
	target,
	redirectTo: postVerificationRedirectTo,
}: {
	period: number;
	request: Request;
	context: AppLoadContext;
	type: VerificationTypes;
	target: string;
	redirectTo?: string;
}) {
	const verifyUrl = getRedirectToUrl({
		request,
		type,
		target,
		redirectTo: postVerificationRedirectTo,
	});
	const redirectTo = new URL(verifyUrl.toString());

	const { otp, ...verificationConfig } = generateTOTP({
		algorithm: 'SHA256',
		period,
	});

	const verificationData = {
		type,
		target,
		...verificationConfig,
		expiresAt: new Date(Date.now() + verificationConfig.period * 1000),
	};
	const db = buildDbClient(context);

	await db
		.insert(verifications)
		.values({ id: createId(), ...verificationData })
		.onConflictDoUpdate({
			target: [verifications.target, verifications.type],
			set: { ...verificationData },
			where: and(
				eq(verifications.type, type),
				eq(verifications.target, target)
			),
		});

	// add the otp to the url we'll email the user.
	verifyUrl.searchParams.set(codeQueryParam, otp);

	return { otp, redirectTo, verifyUrl };
}

export type VerifyFunctionArgs = {
	request: Request;
	context: AppLoadContext;
	submission: Submission<z.infer<typeof VerifySchema>>;
	body: FormData | URLSearchParams;
};

export async function isCodeValid({
	context,
	code,
	type,
	target,
}: {
	context: AppLoadContext;
	code: string;
	type: VerificationTypes | typeof twoFAVerifyVerificationType;
	target: string;
}) {
	const db = buildDbClient(context);

	const verification = await db.query.verifications.findFirst({
		columns: {
			secret: true,
			period: true,
			algorithm: true,
			charSet: true,
		},
		where: and(
			and(eq(verifications.type, type), eq(verifications.target, target)),
			or(
				gt(verifications.expiresAt, new Date()),
				isNull(verifications.expiresAt)
			)
		),
	});
	if (!verification) return false;
	const result = verifyTOTP({
		otp: code,
		secret: verification.secret,
		algorithm: verification.algorithm,
		period: verification.period,
		charSet: verification.charSet,
	});
	if (!result) return false;

	return true;
}

async function validateRequest(
	request: Request,
	context: AppLoadContext,
	body: URLSearchParams | FormData
) {
	const db = buildDbClient(context);

	const submission = await parse(body, {
		schema: () =>
			VerifySchema.superRefine(async (data, ctx) => {
				console.log('verify this', data);
				const codeIsValid = await isCodeValid({
					context,
					code: data[codeQueryParam],
					type: data[typeQueryParam],
					target: data[targetQueryParam],
				});
				if (!codeIsValid) {
					ctx.addIssue({
						path: ['code'],
						code: z.ZodIssueCode.custom,
						message: `Invalid code`,
					});
					return z.NEVER;
				}
			}),

		async: true,
	});

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}

	const { value: submissionValue } = submission;

	async function deleteVerification() {
		await db
			.delete(verifications)
			.where(
				and(
					eq(verifications.target, submissionValue[targetQueryParam]),
					eq(verifications.type, submissionValue[typeQueryParam])
				)
			);
	}

	switch (submissionValue[typeQueryParam]) {
		case 'reset-password': {
			await deleteVerification();
			return handleResetPasswordVerification({
				request,
				context,
				body,
				submission,
			});
		}
		case 'onboarding': {
			await deleteVerification();
			return handleOnboardingVerification({
				request,
				context,
				body,
				submission,
			});
		}
		case 'change-email': {
			await deleteVerification();
			return handleChangeEmailVerification({
				request,
				context,
				body,
				submission,
			});
		}
		case '2fa': {
			return handleLoginTwoFactorVerification({
				request,
				context,
				body,
				submission,
			});
		}
	}
}

export default function VerifyRoute() {
	const data = useLoaderData<typeof loader>();
	const [searchParams] = useSearchParams();
	const isPending = useIsPending();
	const actionData = useActionData<typeof action>();
	const type = VerificationTypeSchema.parse(searchParams.get(typeQueryParam));

	const checkEmail = (
		<>
			<h1 className='text-2xl font-semibold tracking-tight'>
				Check your email
			</h1>
			<p className='text-sm text-muted-foreground'>
				We&apos;ve sent you a code to verify your email address.
			</p>
		</>
	);

	const headings: Record<VerificationTypes, React.ReactNode> = {
		onboarding: checkEmail,
		'reset-password': checkEmail,
		'change-email': checkEmail,
		'2fa': (
			<>
				<h1 className='text-2xl font-semibold tracking-tight'>
					Check your 2FA app
				</h1>
				<p className='text-sm text-muted-foreground'>
					Please enter your 2FA code to verify your identity.
				</p>
			</>
		),
	};

	const [form, fields] = useForm({
		id: 'verify-form',
		constraint: getFieldsetConstraint(VerifySchema),
		lastSubmission: actionData?.submission ?? data!.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: VerifySchema });
		},
		defaultValue: {
			code: searchParams.get(codeQueryParam) ?? '',
			type,
			target: searchParams.get(targetQueryParam) ?? '',
			redirectTo: searchParams.get(redirectToQueryParam) ?? '',
		},
	});

	return (
		<>
			<div className='container flex flex-col justify-center pb-32 pt-20'>
				<div className='flex flex-col space-y-2 text-center'>
					{headings[type]}
				</div>

				<Spacer size='xs' />

				<div className='mx-auto flex w-72 max-w-full flex-col justify-center gap-1'>
					<div>
						<ErrorList errors={form.errors} id={form.errorId} />
					</div>
					<div className='grid gap-6'>
						<Form method='POST' {...form.props} className='flex-1'>
							<AuthenticityTokenInput />
							<Field
								labelProps={{
									htmlFor: fields[codeQueryParam].id,
									children: 'Code',
								}}
								inputProps={conform.input(fields[codeQueryParam])}
								errors={fields[codeQueryParam].errors}
							/>
							<input
								{...conform.input(fields[typeQueryParam], { type: 'hidden' })}
							/>
							<input
								{...conform.input(fields[targetQueryParam], { type: 'hidden' })}
							/>
							<input
								{...conform.input(fields[redirectToQueryParam], {
									type: 'hidden',
								})}
							/>
							<StatusButton
								className='w-full'
								status={isPending ? 'pending' : actionData?.status ?? 'idle'}
								type='submit'
								disabled={isPending}
							>
								Submit
							</StatusButton>
						</Form>
					</div>
				</div>
			</div>
		</>
	);
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />;
}
