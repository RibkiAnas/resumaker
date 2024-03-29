import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import {
	DownloadIcon,
	FocusIcon,
	HomeIcon,
	PencilIcon,
	RefreshCcwIcon,
	Settings,
	ZoomInIcon,
	ZoomOutIcon,
} from 'lucide-react';
import { Separator } from '../ui/separator';
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
import { ProfileForm } from './resumeForm/profile-form';
import {
	DEFAULT_FONT_COLOR,
	selectFormsOrder,
	selectSettings,
	ShowForm,
} from '~/lib/redux/settingsSlice';
import { WorkexperiencesForm } from './resumeForm/work-experiences-form';
import { useAppSelector } from '~/lib/redux/hooks';
import { EducationsForm } from './resumeForm/educations-form';
import { ProjectsForm } from './resumeForm/projects-form';
import { SkillsForm } from './resumeForm/skills-form';
import { CustomForm } from './resumeForm/custom-form';
import { ThemeForm } from './resumeForm/themeForm';
import { selectResume } from '~/lib/redux/resumeSlice';
import {
	A4_HEIGHT_PX,
	A4_WIDTH_PX,
	LETTER_HEIGHT_PX,
	LETTER_WIDTH_PX,
} from '~/lib/constants';
import { ResumeprofilePDF } from './resume/resume-profile-pdf';
import { ResumePDFWorkExperience } from './resume/resume-pdf-work-experience';
import { ResumePDFEducation } from './resume/resume-pdf-education';
import { ResumPDFProject } from './resume/resum-pdf-project';

const formTypeToComponent: { [type in ShowForm]: () => JSX.Element } = {
	workExperiences: WorkexperiencesForm,
	educations: EducationsForm,
	projects: ProjectsForm,
	skills: SkillsForm,
	custom: CustomForm,
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
	const resumee = useAppSelector(selectResume);
	const { profile, workExperiences, educations, projects } = resumee;
	const settings = useAppSelector(selectSettings);
	const isA4 = settings.documentSize === 'A4';
	const width = isA4 ? A4_WIDTH_PX : LETTER_WIDTH_PX;
	const height = isA4 ? A4_HEIGHT_PX : LETTER_HEIGHT_PX;
	const themeColor = settings.themeColor || DEFAULT_FONT_COLOR;

	const handlePrint = useReactToPrint({
		documentTitle: 'Print This Document',
		onBeforePrint: () => console.log('before printing...'),
		onAfterPrint: () => console.log('after printing...'),
		removeAfterPrint: true,
	});

	const { formToHeading, formToShow, formsOrder, showBulletPoints } = settings;

	const builderFormsOrder = useAppSelector(selectFormsOrder);

	const showFormsOrder = formsOrder.filter((form) => formToShow[form]);

	const resumeFormTypeToComponent: { [type in ShowForm]: () => JSX.Element } = {
		workExperiences: () => (
			<ResumePDFWorkExperience
				heading={formToHeading['workExperiences']}
				workExperiences={workExperiences}
				themeColor={themeColor}
			/>
		),
		educations: () => (
			<ResumePDFEducation
				heading={formToHeading['educations']}
				educations={educations}
				themeColor={themeColor}
				showBulletPoints={showBulletPoints['educations']}
			/>
		),
		projects: () => (
			<ResumPDFProject
				heading={formToHeading['projects']}
				projects={projects}
				themeColor={themeColor}
			/>
		),
		skills: () => <></>,
		custom: () => <></>,
	};

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
							<DrawerTitle>Editor</DrawerTitle>
							<DrawerDescription>Edit your resume.</DrawerDescription>
						</DrawerHeader>
						<form className='grid w-full items-start gap-6 overflow-auto p-4 pt-0'>
							<ProfileForm />
							{builderFormsOrder.map((form) => {
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
							<DrawerTitle>Customization</DrawerTitle>
							<DrawerDescription>Customize your resume.</DrawerDescription>
						</DrawerHeader>
						<div className='grid w-full items-start gap-6 overflow-auto'>
							<ThemeForm />
						</div>
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
									width: `${width}px`,
									height: `${height}px`,
								}}
							>
								<div
									ref={templateRef}
									className='flex flex-col w-full h-full p-[var(--margin)]'
									style={{
										color: DEFAULT_FONT_COLOR,
										fontFamily: settings.fontFamily,
										fontSize: settings.fontSize + 'pt',
									}}
								>
									{Boolean(settings.themeColor) && (
										<div
											className='h-[14px]'
											style={{
												width: '100%',
												backgroundColor: themeColor,
											}}
										/>
									)}
									<div
										className='flex flex-col'
										style={{
											padding: '0 80px',
										}}
									>
										<ResumeprofilePDF
											profile={profile}
											themeColor={themeColor}
										/>
										{showFormsOrder.map((form) => {
											const Component = resumeFormTypeToComponent[form];
											return <Component key={form} />;
										})}
									</div>
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
