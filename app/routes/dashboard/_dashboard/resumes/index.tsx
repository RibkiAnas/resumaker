import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
} from '@remix-run/cloudflare';
import { FolderOpen, PenLine, Plus, TrashIcon } from 'lucide-react';
import { Card } from '~/components/ui/card';
import { ScrollArea } from '~/components/ui/scroll-area';
import { cn } from '~/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
	useNavigation,
} from '@remix-run/react';
import { invariantResponse, useIsSubmitting } from '~/utils/misc';
import { conform, useForm } from '@conform-to/react';
import { ErrorList } from '~/components/forms';
import { StatusButton } from '~/components/ui/status-button';
import { eq } from 'drizzle-orm';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';
import { formatDistanceToNow } from 'date-fns';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from '~/components/ui/context-menu';
import { useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { deleteStateFromLocalStorage } from '~/lib/redux/local-storage';
import { redirectWithToast } from '~/utils/toast.server';

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
	_action: z.string().optional(),
	resumeId: z.string().optional(),
	title: z.string().max(titleMaxLength).optional(),
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
	const { _action, resumeId, title } = submission.value;

	const userId = await getUserId(request, context);

	const db = buildDbClient(context);

	if (_action === 'updateOrCreate') {
		await db.transaction(async (tx) => {
			// let resume;

			const user = await tx.query.users.findFirst({
				columns: {
					id: true,
				},
				where: eq(users.id, userId as string),
			});

			if (!resumeId) {
				await tx.insert(resumes).values({
					id: cuid(),
					ownerId: user?.id as string,
					title: title,
					content: '',
				});
			}

			if (resumeId) {
				await tx
					.update(resumes)
					.set({ title: title, updatedAt: new Date() })
					.where(eq(resumes.id, resumeId))
					.all();
			}
		});
	}

	if (_action === 'delete') {
		await db
			.delete(resumes)
			.where(eq(resumes.id, resumeId as string))
			.all();
	}

	throw await redirectWithToast(`/dashboard/resumes`, {
		type: 'success',
		title: 'Resume',
		description: `
      Your resume has been 
      ${!resumeId && _action === 'updateOrCreate' ? 'created' : ''}
      ${resumeId && _action === 'updateOrCreate' ? 'renamed' : ''}
      ${resumeId && _action === 'delete' ? 'deleted' : ''} 
      successfully.`,
	});
}

function Index() {
	const [isOpen, setIsOpen] = useState(false);
	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const [isCreate, setIsCreate] = useState(false);
	const [isUpdate, setIsUpdate] = useState(false);
	const [resumeId, setResumeId] = useState('');

	const data = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const isSubmitting = useIsSubmitting();
	const navigate = useNavigate();
	const { state } = useNavigation();

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
		<ScrollArea className='h-[calc(100vh-90px)] lg:h-[calc(100vh-88px)]'>
			<div className='grid grid-cols-1 gap-8 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
				<Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
					<DialogContent className='sm:max-w-[425px]'>
						<Form method='post' {...form.props}>
							<DialogHeader>
								<DialogTitle>
									{isCreate && 'Create a new resume'}
									{isUpdate && 'Update an existing resume'}
								</DialogTitle>
								<DialogDescription>
									{isCreate &&
										'Start building your resume by giving it a name.'}
									{isUpdate &&
										'Changed your mind about the name? Give it a new one.'}
								</DialogDescription>
							</DialogHeader>
							<AuthenticityTokenInput />
							<div style={{ display: 'none' }} aria-hidden>
								<label htmlFor='name-input'>
									Please leave this field blank
								</label>
								<input id='name-input' name='name' type='text' tabIndex={-1} />
								{isUpdate && (
									<input
										name='resumeId'
										type='text'
										value={resumeId}
										tabIndex={-1}
									/>
								)}
							</div>
							<div className='grid py-4'>
								<div className='items-center gap-4 space-y-2'>
									<Label htmlFor={fields.title.id} className='text-right'>
										Name
									</Label>
									<Input
										autoFocus
										{...conform.input(fields.title)}
										className='col-span-3'
									/>
									<p className='text-xs leading-relaxed opacity-60'>
										Tip: You can name the resume referring to the position you
										are applying for.
									</p>
									{fields.title.errors && fields.title.errors.length > 0 && (
										<div className='min-h-[32px] px-4 pb-3 pt-1'>
											<ErrorList
												id={fields.title.errorId}
												errors={fields.title.errors}
											/>
										</div>
									)}
								</div>
							</div>
							<ErrorList id={form.errorId} errors={form.errors} />
							<DialogFooter>
								<StatusButton
									form={form.id}
									type='submit'
									name='_action'
									value='updateOrCreate'
									disabled={isSubmitting}
									status={isSubmitting ? 'pending' : 'idle'}
									onClick={() => {
										state === 'idle' && setIsOpen(false);
									}}
								>
									{isCreate && `Create`}
									{isUpdate && `Save Changes`}
								</StatusButton>
							</DialogFooter>
						</Form>
					</DialogContent>
				</Dialog>

				<AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Are you sure you want to delete your resume?
							</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete your
								resume and cannot be recovered.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<Form method='post'>
								<AuthenticityTokenInput />
								<div style={{ display: 'none' }} aria-hidden>
									<label htmlFor='name-input'>
										Please leave this field blank
									</label>
									<input
										id='name-input'
										name='name'
										type='text'
										tabIndex={-1}
									/>
									<input
										name='resumeId'
										type='text'
										value={resumeId}
										tabIndex={-1}
									/>
								</div>
								<AlertDialogAction
									name='_action'
									value='delete'
									type='submit'
									onClick={() => deleteStateFromLocalStorage(resumeId)}
								>
									Continue
								</AlertDialogAction>
							</Form>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<Card
					className={cn(
						'relative flex aspect-[1/1.4142] scale-100 cursor-pointer items-center justify-center bg-secondary/50 p-0 transition-transform active:scale-95'
					)}
					onClick={() => {
						setIsOpen(true);
						setIsCreate(true);
						setIsUpdate(false);
					}}
				>
					<Plus size={64} className='h-4 w-4' />
					<div
						className={cn(
							'absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end space-y-0.5 p-4 pt-12',
							'bg-gradient-to-t from-background/80 to-transparent'
						)}
					>
						<h4 className='font-medium text-md'>Create a new resume</h4>

						<p className='text-xs opacity-75'>Start building from scratch</p>
					</div>
				</Card>

				{data.owner.resumes && (
					<>
						{data.owner.resumes
							// .sort((a, b) => sortByDate(a, b, "updatedAt"))
							.map((resume) => (
								<div key={resume.id}>
									{/* <ResumeCard resume={resume} /> */}
									<ContextMenu>
										<ContextMenuTrigger>
											<Card
												className={cn(
													'relative flex aspect-[1/1.4142] scale-100 cursor-pointer items-center justify-center bg-secondary/50 p-0 transition-transform active:scale-95'
												)}
												onClick={() =>
													navigate(`/dashboard/builder/${resume.id}`)
												}
											>
												<div
													className={cn(
														'absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end space-y-0.5 p-4 pt-12',
														'bg-gradient-to-t from-background/80 to-transparent'
													)}
												>
													<h4 className='font-medium text-md'>
														{resume.title}
													</h4>

													<p className='text-xs opacity-75'>
														Last updated{' '}
														{formatDistanceToNow(String(resume.updatedAt))}
													</p>
												</div>
											</Card>
										</ContextMenuTrigger>
										<ContextMenuContent className='w-full'>
											<ContextMenuItem
												onClick={() =>
													navigate(`/dashboard/builder/${resume.id}`)
												}
											>
												<ContextMenuShortcut>
													<FolderOpen className='h-3 w-3' />
												</ContextMenuShortcut>
												Open
											</ContextMenuItem>
											<ContextMenuItem
												onClick={() => {
													setIsOpen(true);
													setIsUpdate(true);
													setIsCreate(false);
													setResumeId(resume.id);
												}}
											>
												<ContextMenuShortcut>
													<PenLine className='h-3 w-3' />
												</ContextMenuShortcut>
												Rename
											</ContextMenuItem>
											<ContextMenuSeparator />
											<ContextMenuItem
												onClick={() => {
													setIsAlertOpen(true);
													setResumeId(resume.id);
												}}
												className='text-destructive focus:text-destructive'
											>
												<ContextMenuShortcut className='text-destructive'>
													<TrashIcon className='h-3 w-3' />
												</ContextMenuShortcut>
												Remove
											</ContextMenuItem>
										</ContextMenuContent>
									</ContextMenu>
								</div>
							))}
					</>
				)}
			</div>
		</ScrollArea>
	);
}

export default Index;
