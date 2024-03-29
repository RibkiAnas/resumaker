import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import {
	Bird,
	DownloadIcon,
	FocusIcon,
	HomeIcon,
	PencilIcon,
	Rabbit,
	RefreshCcwIcon,
	Settings,
	Turtle,
	ZoomInIcon,
	ZoomOutIcon,
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { useRef } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Link } from '@remix-run/react';
import { useReactToPrint } from 'react-to-print';
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '../ui/drawer';
import { Input } from '../ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { ProfileForm } from './resumeForm/profile-form';
import { selectFormsOrder, ShowForm } from '~/lib/redux/settingsSlice';
import { WorkexperiencesForm } from './resumeForm/work-experiences-form';
import { useAppSelector } from '~/lib/redux/hooks';
import { EducationsForm } from './resumeForm/educations-form';
import { ProjectsForm } from './resumeForm/projects-form';

const formTypeToComponent: { [type in ShowForm]: () => JSX.Element } = {
	workExperiences: WorkexperiencesForm,
	educations: EducationsForm,
	projects: ProjectsForm,
	skills: () => <></>,
	custom: () => <></>,
};

function ResumeDisplay({
	resume,
}: {
	resume: {
		id: string;
		title: string | null;
		content: unknown;
	};
}) {
	const templateRef = useRef(null);

	const handlePrint = useReactToPrint({
		documentTitle: 'Print This Document',
		onBeforePrint: () => console.log('before printing...'),
		onAfterPrint: () => console.log('after printing...'),
		removeAfterPrint: true,
	});

	const formsOrder = useAppSelector(selectFormsOrder);

	return (
		<div className='flex h-[100vh] flex-col'>
			<div className='flex w-full items-center justify-between md:justify-center p-2'>
				<Drawer>
					<DrawerTrigger asChild>
						<Button variant='ghost' size='icon' className='md:hidden'>
							<PencilIcon className='h-4 w-4' />
							<span className='sr-only'>Edit your resume</span>
						</Button>
					</DrawerTrigger>
					<DrawerContent className='max-h-[80vh]'>
						<DrawerHeader>
							<DrawerTitle>Configuration</DrawerTitle>
							<DrawerDescription>
								Configure the settings for the model and messages.
							</DrawerDescription>
						</DrawerHeader>
						<form className='grid w-full items-start gap-6 overflow-auto p-4 pt-0'>
							<ProfileForm />
							{formsOrder.map((form) => {
								const Component = formTypeToComponent[form];
								return <Component key={form} />;
							})}
						</form>
					</DrawerContent>
				</Drawer>

				<div className='flex items-center justify-center gap-x-1 lg:mx-auto'>
					<Button asChild size='icon' variant='ghost'>
						<Link to='/dashboard/resumes'>
							<HomeIcon className='h-4 w-4' />
						</Link>
					</Button>
					<span className='mr-2 text-xs opacity-40'>{'/'}</span>
					<h1 className='text-md'>{resume.title}</h1>
				</div>
				<Drawer>
					<DrawerTrigger asChild>
						<Button variant='ghost' size='icon' className='md:hidden'>
							<Settings className='h-4 w-4' />
							<span className='sr-only'>Customize your resume</span>
						</Button>
					</DrawerTrigger>
					<DrawerContent className='max-h-[80vh]'>
						<DrawerHeader>
							<DrawerTitle>Configuration</DrawerTitle>
							<DrawerDescription>
								Configure the settings for the model and messages.
							</DrawerDescription>
						</DrawerHeader>
						<form className='grid w-full items-start gap-6 overflow-auto p-4 pt-0'>
							<fieldset className='grid gap-6 rounded-lg border p-4'>
								<legend className='-ml-1 px-1 text-sm font-medium'>
									Settings
								</legend>
								<div className='grid gap-3'>
									<Label htmlFor='model'>Model</Label>
									<Select>
										<SelectTrigger
											id='model'
											className='items-start [&_[data-description]]:hidden'
										>
											<SelectValue placeholder='Select a model' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='genesis'>
												<div className='flex items-start gap-3 text-muted-foreground'>
													<Rabbit className='size-5' />
													<div className='grid gap-0.5'>
														<p>
															Neural{' '}
															<span className='font-medium text-foreground'>
																Genesis
															</span>
														</p>
														<p className='text-xs' data-description>
															Our fastest model for general use cases.
														</p>
													</div>
												</div>
											</SelectItem>
											<SelectItem value='explorer'>
												<div className='flex items-start gap-3 text-muted-foreground'>
													<Bird className='size-5' />
													<div className='grid gap-0.5'>
														<p>
															Neural{' '}
															<span className='font-medium text-foreground'>
																Explorer
															</span>
														</p>
														<p className='text-xs' data-description>
															Performance and speed for efficiency.
														</p>
													</div>
												</div>
											</SelectItem>
											<SelectItem value='quantum'>
												<div className='flex items-start gap-3 text-muted-foreground'>
													<Turtle className='size-5' />
													<div className='grid gap-0.5'>
														<p>
															Neural{' '}
															<span className='font-medium text-foreground'>
																Quantum
															</span>
														</p>
														<p className='text-xs' data-description>
															The most powerful model for complex computations.
														</p>
													</div>
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className='grid gap-3'>
									<Label htmlFor='temperature'>Temperature</Label>
									<Input id='temperature' type='number' placeholder='0.4' />
								</div>
								<div className='grid gap-3'>
									<Label htmlFor='top-p'>Top P</Label>
									<Input id='top-p' type='number' placeholder='0.7' />
								</div>
								<div className='grid gap-3'>
									<Label htmlFor='top-k'>Top K</Label>
									<Input id='top-k' type='number' placeholder='0.0' />
								</div>
							</fieldset>
							<fieldset className='grid gap-6 rounded-lg border p-4'>
								<legend className='-ml-1 px-1 text-sm font-medium'>
									Messages
								</legend>
								<div className='grid gap-3'>
									<Label htmlFor='role'>Role</Label>
									<Select defaultValue='system'>
										<SelectTrigger>
											<SelectValue placeholder='Select a role' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='system'>System</SelectItem>
											<SelectItem value='user'>User</SelectItem>
											<SelectItem value='assistant'>Assistant</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className='grid gap-3'>
									<Label htmlFor='content'>Content</Label>
									<Textarea id='content' placeholder='You are a...' />
								</div>
							</fieldset>
						</form>
					</DrawerContent>
				</Drawer>
			</div>
			<Separator />
			<TransformWrapper
				centerOnInit
				maxScale={2}
				minScale={0.4}
				initialScale={0.8}
				// ref={transformRef}
				limitToBounds={false}
			>
				{({ zoomIn, zoomOut, resetTransform, centerView }) => (
					<>
						<TransformComponent
							wrapperClass='!h-screen bg-muted/50'
							contentClass='flex items-center justify-center pointer-events-none'
						>
							<div
								className='relative bg-white shadow-2xl'
								style={{
									width: `${210 * 3.78}px`,
									minHeight: `${297 * 3.78}px`,
								}}
							>
								<div ref={templateRef} className='p-[var(--margin)] space-y-3'>
									My cool content here!
								</div>
							</div>
						</TransformComponent>
						<Separator />
						<div className='flex items-center justify-between p-2'>
							<div className='flex items-center gap-2'>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => zoomIn()}
										>
											<ZoomInIcon className='h-4 w-4' />
											<span className='sr-only'>ZoomIn</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>ZoomIn</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => zoomOut()}
										>
											<ZoomOutIcon className='h-4 w-4' />
											<span className='sr-only'>ZoomOut</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>ZoomOut</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => resetTransform()}
										>
											<RefreshCcwIcon className='h-4 w-4' />
											<span className='sr-only'>Rest Zoom</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>Rest Zoom</TooltipContent>
								</Tooltip>
								<Separator orientation='vertical' className='mx-1 h-6' />
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant='ghost'
											size='icon'
											onClick={() => centerView()}
										>
											<FocusIcon className='h-4 w-4' />
											<span className='sr-only'>Center View</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>Center View</TooltipContent>
								</Tooltip>
							</div>
							<div className='flex items-center justify-center'>
								<Separator orientation='vertical' className='mx-2 h-6' />
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant='ghost'
											size='icon'
											onClick={() =>
												handlePrint(null, () => templateRef.current)
											}
										>
											<DownloadIcon className='h-4 w-4' />
											<span className='sr-only'>Download PDF</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>Download PDF</TooltipContent>
								</Tooltip>
							</div>
						</div>
					</>
				)}
			</TransformWrapper>
		</div>
	);
}

export default ResumeDisplay;
