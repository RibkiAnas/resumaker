import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	redirect,
} from '@remix-run/cloudflare';
import { Plus } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { ScrollArea } from '~/components/ui/scroll-area';
import { cn } from '~/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { getUserId } from '~/utils/auth.server';
import { buildDbClient } from '~/utils/client';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import { resumes, users } from '~/drizzle/schema.server';
import { validateCSRF } from '~/utils/csrf.server';
import { z } from 'zod';
import { createId as cuid } from '@paralleldrive/cuid2';
import {
	Form,
	useActionData,
	useLoaderData,
	useNavigate,
} from '@remix-run/react';
import { invariantResponse, useIsSubmitting } from '~/utils/misc';
import { conform, useForm } from '@conform-to/react';
import { ErrorList } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import { eq } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { formatDistanceToNow } from 'date-fns';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	const userId = await getUserId(request, context);

	const db = buildDbClient(context);

	const owner = await db.query.users.findFirst({
		columns: {
			id: true,
			name: true,
			username: true,
		},
		with: {
			image: {
				columns: {
					id: true,
				},
			},
			resumes: {
				columns: {
					id: true,
					title: true,
					updatedAt: true,
				},
			},
		},
		where: eq(users.id, userId as string),
	});

	invariantResponse(owner, 'Owner not found', { status: 404 });
	return json({ owner });
};

const titleMaxLength = 100;
// const contentMaxLength = 10000

const resumeSchema = z.object({
	title: z.string().max(titleMaxLength),
	// content: z.string(),
});

export async function action({ request, context }: ActionFunctionArgs) {
	const formData = await request.formData();

	await validateCSRF(formData, request.headers);
	invariantResponse(!formData.get('name'), 'Form not submitted properly');

	const submission = parse(formData, {
		schema: resumeSchema,
	});

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const);
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 });
	}
	const { title } = submission.value;

	const userId = await getUserId(request, context);

	const db = buildDbClient(context);

	await db.insert(resumes).values({
		id: cuid(),
		ownerId: userId as string,
		title: title,
		content: '',
	});

	return redirect(`/dashboard/resumes`);
}

function Index() {
	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const isSubmitting = useIsSubmitting();
	const navigate = useNavigate();

	const [form, fields] = useForm({
		id: 'resume-editor',
		constraint: getFieldsetConstraint(resumeSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: resumeSchema });
		},
		defaultValue: {
			title: '',
			// content: '',
		},
	});

	return (
		<ScrollArea className='h-[calc(100vh-140px)] lg:h-[calc(100vh-88px)]'>
			<div className='grid grid-cols-1 gap-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
				<Dialog>
					<DialogTrigger asChild>
						<Card
							className={cn(
								'relative flex aspect-[1/1.4142] scale-100 cursor-pointer items-center justify-center bg-secondary/50 p-0 transition-transform active:scale-95'
							)}
						>
							<Plus size={64} className='h-4 w-4' />
							<div
								className={cn(
									'absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end space-y-0.5 p-4 pt-12',
									'bg-gradient-to-t from-background/80 to-transparent'
								)}
							>
								<h4 className='font-medium text-md'>Create a new resume</h4>

								<p className='text-xs opacity-75'>
									Start building from scratch
								</p>
							</div>
						</Card>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Create a new resume</DialogTitle>
							<DialogDescription>
								Start building your resume by giving it a name.
							</DialogDescription>
						</DialogHeader>
						<Form method='post' {...form.props}>
							<AuthenticityTokenInput />
							<div style={{ display: 'none' }} aria-hidden>
								<label htmlFor='name-input'>
									Please leave this field blank
								</label>
								<input id='name-input' name='name' type='text' tabIndex={-1} />
							</div>
							<div className='grid gap-4 py-4'>
								<div className='grid grid-cols-4 items-center gap-4'>
									<Label htmlFor={fields.title.id} className='text-right'>
										Name
									</Label>
									<Input
										autoFocus
										{...conform.input(fields.title)}
										className='col-span-3'
									/>
									<div className='min-h-[32px] px-4 pb-3 pt-1'>
										<ErrorList
											id={fields.title.errorId}
											errors={fields.title.errors}
										/>
									</div>
								</div>
							</div>
							<ErrorList id={form.errorId} errors={form.errors} />
							{/* <DialogFooter> */}
							{/* <Button type='submit'>Create</Button> */}
							<StatusButton
								form={form.id}
								type='submit'
								disabled={isSubmitting}
								status={isSubmitting ? 'pending' : 'idle'}
							>
								Submit
							</StatusButton>
							{/* </DialogFooter> */}
						</Form>
					</DialogContent>
				</Dialog>

				{data.owner.resumes && (
					<>
						{data.owner.resumes
							// .sort((a, b) => sortByDate(a, b, "updatedAt"))
							.map((resume) => (
								<div key={resume.id}>
									{/* <ResumeCard resume={resume} /> */}
									<Card
										className={cn(
											'relative flex aspect-[1/1.4142] scale-100 cursor-pointer items-center justify-center bg-secondary/50 p-0 transition-transform active:scale-95'
										)}
										onClick={() => navigate(`/dashboard/builder/${resume.id}`)}
									>
										{/* <Plus size={64} className='h-4 w-4' /> */}
										<div
											className={cn(
												'absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end space-y-0.5 p-4 pt-12',
												'bg-gradient-to-t from-background/80 to-transparent'
											)}
										>
											<h4 className='font-medium text-md'>{resume.title}</h4>

											<p className='text-xs opacity-75'>
												Last updated{' '}
												{formatDistanceToNow(String(resume.updatedAt))}
											</p>
										</div>
									</Card>
								</div>
							))}
					</>
				)}
			</div>
		</ScrollArea>
	);
}

export default Index;
